
## Plano: Corrigir Exibicao de Linhas do Pedido e Ordens em PedidoViewDirecao

### Problema Identificado

Na pagina `/direcao/pedidos/:id`, as linhas do pedido e as linhas das ordens de producao nao aparecem devido a dois problemas:

**Problema 1 - Linhas do Pedido:**
```typescript
// Linha 73-74 de PedidoViewDirecao.tsx
const { data: linhasData } = await supabase
  .from('linhas_pedido' as any)  // TABELA NAO EXISTE!
```

A pagina busca da tabela `linhas_pedido` que nao existe. A tabela correta e `pedido_linhas`.

**Problema 2 - Linhas das Ordens:**
A pagina busca as ordens de producao (Soldagem, Perfiladeira, Separacao, etc.) mas nao busca as linhas/materiais vinculados a cada ordem (tabela `linhas_ordens`).

### Evidencia do Banco de Dados

- Tabela `pedido_linhas` existe com 12+ linhas para este pedido
- Tabela `linhas_ordens` existe com 15 linhas vinculadas as ordens
- Tabela `linhas_pedido` NAO EXISTE

---

### Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/direcao/PedidoViewDirecao.tsx` | Modificar | Corrigir nome da tabela e adicionar busca de linhas das ordens |

---

### Mudanca 1: Corrigir Nome da Tabela de Linhas do Pedido

**Antes (linha 74):**
```typescript
const { data: linhasData } = await supabase
  .from('linhas_pedido' as any)
  .select('id, nome_produto, descricao_produto, quantidade, tamanho')
  .eq('pedido_id', id)
  .order('ordem', { ascending: true });
```

**Depois:**
```typescript
const { data: linhasData } = await supabase
  .from('pedido_linhas')
  .select('id, nome_produto, descricao_produto, quantidade, tamanho')
  .eq('pedido_id', id)
  .order('ordem', { ascending: true });
```

---

### Mudanca 2: Adicionar Busca de Linhas das Ordens

Apos buscar as ordens (linhas 84-102), buscar tambem as linhas de cada ordem:

**Adicionar apos linha 102:**
```typescript
// Buscar linhas de cada ordem
for (const ordem of ordensResult) {
  const { data: linhasOrdem } = await supabase
    .from('linhas_ordens')
    .select('id, item, quantidade, tamanho, concluida')
    .eq('ordem_id', ordem.id)
    .eq('tipo_ordem', ordem.tipo.toLowerCase())
    .order('created_at', { ascending: true });
  
  (ordem as any).linhas = linhasOrdem || [];
}
```

---

### Mudanca 3: Atualizar Interface para Incluir Linhas

**Atualizar interface Ordem (linha 15-21):**
```typescript
interface Ordem {
  id: string;
  tipo: string;
  numero_ordem: string;
  status: string;
  capturado_por_nome?: string | null;
  linhas?: Array<{
    id: string;
    item: string;
    quantidade: number;
    tamanho?: string | null;
    concluida: boolean;
  }>;
}
```

---

### Mudanca 4: Exibir Linhas das Ordens na UI

**Atualizar o card de ordens (linhas 389-404) para mostrar as linhas:**
```tsx
{pedido.ordens.map((ordem) => (
  <div key={ordem.id} className="p-3 rounded-lg bg-white/5">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {getOrdemIcon(ordem.tipo)}
        <span className="font-medium text-white text-sm">{ordem.tipo}</span>
      </div>
      {getOrdemStatusIcon(ordem.status)}
    </div>
    <p className="text-xs text-white/60">#{ordem.numero_ordem}</p>
    
    {/* Linhas da ordem */}
    {(ordem as any).linhas?.length > 0 && (
      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
        {(ordem as any).linhas.map((linha: any) => (
          <div key={linha.id} className="flex items-center justify-between text-xs">
            <span className="text-white/70 truncate flex-1">{linha.item}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white/50">{linha.quantidade}x</span>
              {linha.concluida && (
                <CheckCircle2 className="w-3 h-3 text-green-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
))}
```

---

### Fluxo Corrigido

```text
ANTES (COM PROBLEMA):
1. Buscar pedido -> OK
2. Buscar linhas de 'linhas_pedido' -> TABELA NAO EXISTE -> 0 linhas
3. Buscar ordens -> OK (3 ordens encontradas)
4. NAO busca linhas das ordens -> ordens sem materiais

DEPOIS (CORRIGIDO):
1. Buscar pedido -> OK
2. Buscar linhas de 'pedido_linhas' -> 12+ linhas encontradas
3. Buscar ordens -> OK (3 ordens encontradas)
4. Para cada ordem, buscar linhas de 'linhas_ordens' -> 15 linhas vinculadas
```

---

### Secao Tecnica

**Tabelas envolvidas:**
- `pedido_linhas`: Armazena linhas do pedido (produtos, quantidades, tamanhos)
- `linhas_ordens`: Armazena linhas de cada ordem de producao (materiais necessarios)

**Relacionamentos:**
- `pedido_linhas.pedido_id` -> `pedidos_producao.id`
- `linhas_ordens.ordem_id` -> `ordens_*.id` (tabelas de ordens especificas)
- `linhas_ordens.tipo_ordem` -> Identifica a qual tabela de ordem pertence
- `linhas_ordens.pedido_linha_id` -> `pedido_linhas.id` (relacionamento opcional)

---

### Resultado Esperado

1. Secao "Itens do Pedido" exibira as 12+ linhas cadastradas
2. Cada card de ordem de producao exibira seus materiais/linhas
3. Usuario podera ver status de conclusao de cada linha (check verde)
