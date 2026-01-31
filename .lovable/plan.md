
# Plano: Sistema de Desbloqueio de Meta

## Conceito

Quando uma meta e criada, ela fica "bloqueada" ate o colaborador clicar em um botao dourado "Desbloquear Meta" na pagina de producao. Apos desbloqueada, a barra de progresso aparece normalmente e a meta nunca volta a ser bloqueada.

## Alteracoes Necessarias

### 1. Banco de Dados

Adicionar coluna `desbloqueada` na tabela `metas_colaboradores`:

```sql
ALTER TABLE metas_colaboradores 
ADD COLUMN desbloqueada BOOLEAN DEFAULT FALSE;
```

### 2. Atualizar Interface TypeScript

**Arquivo:** `src/hooks/useMetasColaboradorIndividual.ts`

Adicionar campo ao tipo `MetaColaborador`:
```typescript
export interface MetaColaborador {
  // ... campos existentes
  desbloqueada: boolean; // NOVO
}
```

Adicionar hook para desbloquear meta:
```typescript
export function useDesbloquearMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ metaId, userId }: { metaId: string; userId: string }) => {
      const { error } = await supabase
        .from("metas_colaboradores")
        .update({ desbloqueada: true })
        .eq("id", metaId);
      if (error) throw error;
      return { metaId, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["metas-colaborador", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["meta-ativa-progresso"] });
    },
  });
}
```

### 3. Redesenhar MetaProgressoBar (Design Minimalista)

**Arquivo:** `src/components/metas/MetaProgressoBar.tsx`

Estados visuais:

**Estado Bloqueado:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│     [Desbloquear Meta]  (botao dourado)         │
│                                                 │
│     Recompensa: R$ 150,00 (maior destaque)      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Estado Desbloqueado:**
```
┌─────────────────────────────────────────────────┐
│  Meta Ativa                 500m / 10.000m      │
│  ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░  5%         │
│                                                 │
│           R$ 150,00  (recompensa grande)        │
└─────────────────────────────────────────────────┘
```

Logica do componente:
- Verificar `meta.desbloqueada`
- Se `false`: mostrar botao dourado + recompensa
- Se `true`: mostrar barra de progresso + recompensa em destaque

Design do botao dourado:
```tsx
<Button
  className="bg-gradient-to-r from-amber-500 to-yellow-500 
             hover:from-amber-600 hover:to-yellow-600 
             text-white font-semibold px-6 py-3 
             shadow-lg shadow-amber-500/25"
  onClick={handleDesbloquear}
>
  <Unlock className="mr-2 h-5 w-5" />
  Desbloquear Meta
</Button>
```

Recompensa com destaque maior:
```tsx
<span className="text-lg font-bold text-amber-500">
  R$ {recompensa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
</span>
```

### 4. Fluxo de Uso

```text
1. Admin cria meta para colaborador
   └─> meta.desbloqueada = false

2. Colaborador acessa /producao/perfiladeira
   └─> Ve botao dourado "Desbloquear Meta"
   └─> Ve valor da recompensa

3. Colaborador clica no botao
   └─> UPDATE metas_colaboradores SET desbloqueada = true
   └─> Invalidar cache

4. Tela atualiza
   └─> Barra de progresso aparece
   └─> Recompensa continua visivel (maior)

5. Colaborador conclui ordens
   └─> Progresso atualiza em tempo real
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| Banco de dados | Adicionar coluna `desbloqueada` |
| `src/hooks/useMetasColaboradorIndividual.ts` | Adicionar campo e hook |
| `src/components/metas/MetaProgressoBar.tsx` | Redesenhar com estados bloqueado/desbloqueado |

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE metas_colaboradores 
ADD COLUMN desbloqueada BOOLEAN DEFAULT FALSE;
```

### Verificacao no Componente
```typescript
// Na query, incluir campo desbloqueada
const { data: meta } = await supabase
  .from("metas_colaboradores")
  .select("*") // ja inclui desbloqueada
  ...

// No retorno
return {
  meta,
  progresso,
  porcentagem,
  desbloqueada: meta.desbloqueada ?? false, // fallback para metas antigas
};
```

### Mutation para Desbloquear
```typescript
const desbloquear = useDesbloquearMeta();

const handleDesbloquear = () => {
  desbloquear.mutate({ 
    metaId: metaInfo.meta.id, 
    userId 
  });
};
```
