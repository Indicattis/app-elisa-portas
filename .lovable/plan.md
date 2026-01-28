
## Plano: Selecionar Linha do Problema ao Pausar Ordem

### Objetivo
Permitir que ao pausar uma ordem, o usuario selecione qual linha tem problema OU digite um motivo customizado ("outros"). Exibir essas informacoes na sidebar lateral direita em /fabrica/ordens-pedidos.

---

### Mudanca 1: Adicionar Coluna no Banco de Dados

**Tipo:** Migration SQL

Adicionar `linha_problema_id` nas tabelas de ordens para referenciar a linha com problema:

```sql
ALTER TABLE ordens_soldagem 
ADD COLUMN linha_problema_id UUID REFERENCES linhas_ordens(id) ON DELETE SET NULL;

ALTER TABLE ordens_perfiladeira 
ADD COLUMN linha_problema_id UUID REFERENCES linhas_ordens(id) ON DELETE SET NULL;

ALTER TABLE ordens_separacao 
ADD COLUMN linha_problema_id UUID REFERENCES linhas_ordens(id) ON DELETE SET NULL;
```

---

### Mudanca 2: Atualizar AvisoFaltaModal

**Arquivo:** `src/components/production/AvisoFaltaModal.tsx`

Adicionar props para linhas e retornar tambem a linha selecionada:

```typescript
interface LinhaSimples {
  id: string;
  item: string;
  quantidade: number;
  tamanho: string | null;
}

interface AvisoFaltaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroOrdem: string;
  linhas?: LinhaSimples[];  // NOVO
  onConfirm: (justificativa: string, linhaProblemaId?: string) => Promise<void>;  // ATUALIZADO
  isPausing?: boolean;
}
```

UI atualizada:
- Adicionar Select com opcoes das linhas + "Outros"
- Se linha selecionada: pre-preencher justificativa com nome do item
- Se "Outros": mostrar textarea para digitacao livre
- Retornar linhaProblemaId quando aplicavel

```tsx
const [tipoProblema, setTipoProblema] = useState<'linha' | 'outros'>('outros');
const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null);

// UI
<Select value={tipoProblema} onValueChange={...}>
  <SelectItem value="outros">Outros (digitar motivo)</SelectItem>
  {linhas.map(linha => (
    <SelectItem key={linha.id} value={linha.id}>
      {linha.item} - Qtd: {linha.quantidade}
    </SelectItem>
  ))}
</Select>

{tipoProblema === 'outros' ? (
  <Textarea ... />
) : (
  <div className="bg-amber-50 p-3 rounded">
    Item selecionado: {linhaInfo.item}
  </div>
)}
```

---

### Mudanca 3: Atualizar Hook useOrdemProducao

**Arquivo:** `src/hooks/useOrdemProducao.ts`

Modificar a mutation `pausarOrdem` para aceitar `linhaProblemaId`:

```typescript
const pausarOrdem = useMutation({
  mutationFn: async ({ 
    ordemId, 
    justificativa,
    linhaProblemaId  // NOVO
  }: { 
    ordemId: string; 
    justificativa: string;
    linhaProblemaId?: string;
  }) => {
    // ...
    const { error } = await supabase
      .from(tabelaOrdem)
      .update({
        pausada: true,
        pausada_em: new Date().toISOString(),
        justificativa_pausa: justificativa,
        linha_problema_id: linhaProblemaId || null,  // NOVO
        tempo_acumulado_segundos: tempoTotal,
        responsavel_id: null,
      })
      .eq('id', ordemId);
    // ...
  },
});
```

---

### Mudanca 4: Atualizar OrdemDetalhesSheet

**Arquivo:** `src/components/production/OrdemDetalhesSheet.tsx`

Passar linhas para o AvisoFaltaModal e atualizar callback:

```typescript
// Atualizar interface de prop
onPausarOrdem?: (ordemId: string, justificativa: string, linhaProblemaId?: string) => Promise<void>;

// No AvisoFaltaModal
<AvisoFaltaModal
  open={avisoFaltaModalOpen}
  onOpenChange={setAvisoFaltaModalOpen}
  numeroOrdem={ordem.numero_ordem}
  linhas={linhas}  // NOVO - passar linhas da ordem
  onConfirm={async (justificativa, linhaProblemaId) => {
    await onPausarOrdem(ordem.id, justificativa, linhaProblemaId);
    onOpenChange(false);
  }}
  isPausing={isPausing}
/>
```

---

### Mudanca 5: Atualizar Paginas de Producao

**Arquivos:** 
- `src/pages/ProducaoPerfiladeira.tsx`
- `src/pages/fabrica/producao/SoldaMinimalista.tsx`
- etc.

Atualizar `handlePausarOrdem` para aceitar o novo parametro:

```typescript
const handlePausarOrdem = async (ordemId: string, justificativa: string, linhaProblemaId?: string) => {
  await pausarOrdem.mutateAsync({ ordemId, justificativa, linhaProblemaId });
  setSheetOpen(false);
};
```

---

### Mudanca 6: Atualizar Interface OrdemStatus

**Arquivo:** `src/hooks/useOrdensPorPedido.ts`

Adicionar informacao da linha problema:

```typescript
export interface LinhaProblemaInfo {
  id: string;
  item: string;
  quantidade: number;
  tamanho: string | null;
}

export interface OrdemStatus {
  // ... campos existentes
  pausada: boolean;
  justificativa_pausa: string | null;
  pausada_em: string | null;
  linha_problema: LinhaProblemaInfo | null;  // NOVO
}
```

---

### Mudanca 7: Atualizar Queries do Hook

**Arquivo:** `src/hooks/useOrdensPorPedido.ts`

Buscar `linha_problema_id` e dados da linha:

```typescript
// Nas queries de ordens
supabase
  .from('ordens_soldagem')
  .select(`
    id, pedido_id, numero_ordem, status, responsavel_id, 
    pausada, justificativa_pausa, pausada_em,
    linha_problema_id,
    linha_problema:linha_problema_id (id, item, quantidade, tamanho)
  `)
  .in('pedido_id', pedidoIds),
```

No `criarOrdemStatus`:

```typescript
const criarOrdemStatus = (tipo: TipoOrdem): OrdemStatus => {
  const ordem = ordensDosPedido[tipo];
  const linhaProblema = ordem?.linha_problema;
  return {
    // ... campos existentes
    linha_problema: linhaProblema ? {
      id: linhaProblema.id,
      item: linhaProblema.item,
      quantidade: linhaProblema.quantidade,
      tamanho: linhaProblema.tamanho,
    } : null,
  };
};
```

---

### Mudanca 8: Exibir na Sidebar OrdemLinhasSheet

**Arquivo:** `src/components/fabrica/OrdemLinhasSheet.tsx`

Adicionar secao de aviso quando ordem pausada:

```tsx
{/* Alerta de ordem pausada */}
{ordem?.pausada && (
  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
    <div className="flex items-center gap-2 mb-2">
      <Pause className="w-4 h-4 text-red-400" />
      <span className="text-sm font-medium text-red-300">Ordem Pausada</span>
    </div>
    
    {ordem.linha_problema && (
      <div className="mb-2 p-2 rounded bg-red-500/20">
        <p className="text-xs text-red-200 font-medium">Linha com problema:</p>
        <p className="text-sm text-white">
          {ordem.linha_problema.item} - Qtd: {ordem.linha_problema.quantidade}
          {ordem.linha_problema.tamanho && ` - Tam: ${ordem.linha_problema.tamanho}`}
        </p>
      </div>
    )}
    
    {ordem.justificativa_pausa && (
      <div className="p-2 rounded bg-zinc-800/50">
        <p className="text-xs text-zinc-400 font-medium">Motivo:</p>
        <p className="text-sm text-zinc-300">{ordem.justificativa_pausa}</p>
      </div>
    )}
  </div>
)}
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/migrations/xxx.sql` | Adicionar coluna `linha_problema_id` |
| `src/components/production/AvisoFaltaModal.tsx` | Select de linhas + opcao "Outros" |
| `src/hooks/useOrdemProducao.ts` | Aceitar `linhaProblemaId` na mutation |
| `src/components/production/OrdemDetalhesSheet.tsx` | Passar linhas ao modal |
| `src/pages/ProducaoPerfiladeira.tsx` | Atualizar handler |
| `src/pages/fabrica/producao/SoldaMinimalista.tsx` | Atualizar handler |
| `src/hooks/useOrdensPorPedido.ts` | Buscar e mapear linha_problema |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Exibir alerta com linha/motivo |

---

### Fluxo Visual

```text
+----------------------------------+
|   Aviso de Falta - Modal         |
+----------------------------------+
| Selecione o problema:            |
| [v Linha: Perfil L 40mm      ]   |
|                                  |
|  ou                              |
|                                  |
| [v Outros (digitar motivo)   ]   |
| +------------------------------+ |
| | Falta de material...         | |
| +------------------------------+ |
|                                  |
| [Cancelar]  [Pausar Ordem]       |
+----------------------------------+

+----------------------------------+
|   OrdemLinhasSheet (Sidebar)     |
+----------------------------------+
| Soldagem #OSL-2026-0008          |
|                                  |
| +------------------------------+ |
| | ⏸️ Ordem Pausada              | |
| | Linha com problema:           | |
| | Perfil L 40mm - Qtd: 5        | |
| |                               | |
| | Motivo:                       | |
| | Aguardando reposicao...       | |
| +------------------------------+ |
|                                  |
| [ ] Item 1                       |
| [x] Item 2                       |
| [ ] Item 3                       |
+----------------------------------+
```
