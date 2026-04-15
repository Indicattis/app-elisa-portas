

## Plano: Corrigir 0 itens na venda (join inválido)

### Diagnóstico
A query em `VendaPendenteDetalhesSheet.tsx` (linha 70) inclui `vendas_catalogo (nome)` como join embarcado no select de `produtos_vendas`. Porém, **não existe FK** entre `produtos_vendas.vendas_catalogo_id` e `vendas_catalogo.id` no banco. O PostgREST falha silenciosamente e retorna `null` para `produtos_vendas`, resultando em 0 itens.

### Solução (2 opções, ambas necessárias)

**1. Criar FK no banco** (migração SQL)
```sql
ALTER TABLE public.produtos_vendas
ADD CONSTRAINT produtos_vendas_vendas_catalogo_id_fkey
FOREIGN KEY (vendas_catalogo_id)
REFERENCES public.vendas_catalogo(id);
```

**2. Fallback no código** — caso a FK não resolva ou haja dados órfãos, remover `vendas_catalogo (nome)` do select e buscar o nome do catálogo separadamente, ou usar um select sem o join problemático.

### Abordagem recomendada
- Aplicar a migração para criar a FK
- Manter o `vendas_catalogo (nome)` no select (já que com a FK o PostgREST reconhece o relacionamento)
- Verificar se existem `vendas_catalogo_id` órfãos antes de criar a FK

### Escopo
- 1 migração SQL (ADD CONSTRAINT)
- Possível ajuste em `VendaPendenteDetalhesSheet.tsx` se houver dados órfãos

