

# Adicionar seção final de resumo no DRE mensal

## O que será feito

Adicionar uma seção de resumo final abaixo das despesas (e fora do grid de 2 colunas) com uma linha horizontal contendo 9 colunas:

| Faturamento Bruto | % Bruto | Faturamento Líquido (Lucro Bruto) | Despesas Fixas | Folha Salarial | Despesas Projetadas | Despesa Variável (Não esperadas) | Lucro Líquido | % Lucro Líquido |
|---|---|---|---|---|---|---|---|---|

## Cálculos

- **Faturamento Bruto**: `faturamento.total` (já calculado)
- **% Bruto**: `(lucro.total / faturamento.total) * 100`
- **Faturamento Líquido (Lucro Bruto)**: `lucro.total`
- **Despesas Fixas**: `totalDespFixas` (já calculado)
- **Folha Salarial**: `totalDespFolha`
- **Despesas Projetadas**: `totalDespProjetadas`
- **Despesa Variável (Não esperadas)**: `totalDespNaoEsperadas`
- **Lucro Líquido**: `lucro.total - totalDespFixas - totalDespFolha - totalDespProjetadas - totalDespNaoEsperadas`
- **% Lucro Líquido**: `(lucroLiquido / faturamento.total) * 100`

## Alteração em `DREMesDirecao.tsx`

Inserir após o fechamento do grid de despesas (após linha 486) um novo bloco com uma tabela/card horizontal contendo as 9 colunas, usando o mesmo estilo visual (`rounded-xl bg-white/5 border border-white/10`). Valores negativos em vermelho, positivos em verde. Os percentuais formatados com 1 casa decimal + "%".

