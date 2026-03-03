

# Unificar Despesas Projetadas com Variáveis Não Esperadas

## O que será feito

1. **Remover** a seção "Despesas Projetadas" da coluna esquerda (linhas 520-528)
2. **Combinar** as despesas projetadas (`despesasProjetadas`) com as não esperadas (`despesasNaoEsperadas`) na seção que passará a se chamar **"Despesas Variáveis"**
3. **Atualizar o resumo final** para unificar os dois totais numa única linha "Desp. Variáveis"

## Alterações em `DREMesDirecao.tsx`

### 1. Seção de despesas (linhas 520-537)
- Remover o bloco `<DespesaSection title="Despesas Projetadas" ...>`
- Renomear "Despesas Variáveis Não Esperadas" para **"Despesas Variáveis"**
- Combinar as duas listas: `[...despesasProjetadas, ...despesasNaoEsperadas]`
- O total passa a ser `totalDespProjetadas + totalDespNaoEsperadas`
- Ao adicionar nova despesa, manter modalidade `variavel_nao_esperada`

### 2. Resumo final (linhas 611-612)
- Remover a linha separada de "Desp. Projetadas"
- Renomear "Desp. Variável (Não esperadas)" para **"Desp. Variáveis"** com valor = `totalDespProjetadas + totalDespNaoEsperadas`

### 3. Painel lateral (linhas 541-579)
- Mantém inalterado — continua mostrando "Despesas Projetadas do Ano" com os valores mensais e anuais

### Arquivo alterado
- `src/pages/direcao/DREMesDirecao.tsx`

