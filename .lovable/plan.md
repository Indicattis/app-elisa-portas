

## Plano: Adicionar campo "Aparece no DRE" aos tipos de custos

### Alterações

**1. Migração SQL**
- Adicionar coluna `aparece_no_dre BOOLEAN NOT NULL DEFAULT true` à tabela `tipos_custos`
- Todos os registros existentes receberão `true` automaticamente pelo default

**2. `src/hooks/useTiposCustos.ts`**
- Adicionar `aparece_no_dre: boolean` à interface `TipoCusto`
- Incluir o campo no `select`, `insert` e `update`

**3. `src/pages/direcao/DREDespesasDirecao.tsx`**
- Adicionar `aparece_no_dre: true` ao estado inicial do form
- No dialog de criação/edição, adicionar um checkbox/switch "Aparece no DRE" (ativo por padrão)
- Na edição, carregar o valor atual do campo
- Na tabela, exibir indicador visual (badge ou ícone) quando `aparece_no_dre = false`

### Arquivos alterados
- Nova migração SQL (1 arquivo)
- `src/hooks/useTiposCustos.ts`
- `src/pages/direcao/DREDespesasDirecao.tsx`

