

## Plano: Corrigir sincronização entre Custos e DRE

### Problema identificado
A página de Custos (`useCustosMensais.ts`) salva despesas variáveis com `modalidade = "projetada"`, mas o hook `useDRE.ts` (usado para validar e gerar o DRE formal) filtra por `modalidade = "variavel"` — que nunca encontra registros.

Dados no banco confirmam: todas as despesas variáveis têm `modalidade = "projetada"`.

### Correção em `src/hooks/useDRE.ts`

1. **Validação** (linhas ~106-109): trocar `.eq("modalidade", "variavel")` por `.eq("modalidade", "projetada")`

2. **Geração** (linhas ~183-185): trocar o filtro `d.modalidade === 'variavel'` por `d.modalidade === 'projetada'` ao calcular `despesasVariaveis`

### Arquivo alterado
- `src/hooks/useDRE.ts` — 2 pontos de correção (validação + geração)

