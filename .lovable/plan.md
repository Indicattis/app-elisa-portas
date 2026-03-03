

# Adicionar coluna "Gasto do Mês" na seção Despesas Projetadas do Ano

## O que será feito

Na seção lateral "Despesas Projetadas do Ano", adicionar uma segunda coluna mostrando o valor real gasto no mês atual para cada tipo de custo. Os dados já existem em `despesasProjetadas` (despesas com `modalidade = 'projetada'`). Basta cruzar pelo nome com `tiposCustosVariaveis`.

## Alteração em `DREMesDirecao.tsx` (linhas ~527-551)

### Layout atualizado

Para cada item de `tiposCustosVariaveis`, buscar em `despesasProjetadas` a despesa correspondente pelo nome e exibir seu `valor_real`. A tabela terá 3 colunas: Nome | Gasto Mês | Projetado Anual.

```
Despesas Projetadas do Ano
                              Mês Atual    Anual
Bônus Colaboradores          R$ 0,00    R$ 48.000
Comissão de Vendas           R$ 5.000   R$ 240.000
...
Total                        R$ X       R$ Y
```

### Detalhes técnicos
- Cruzar `tiposCustosVariaveis[].nome` com `despesasProjetadas[].nome` para encontrar o valor gasto no mês
- Adicionar header com "Mês" e "Anual"
- Adicionar total do mês (que já é `totalDespProjetadas`)
- Estilo consistente com o painel existente

### Arquivo alterado
- `src/pages/direcao/DREMesDirecao.tsx` (seção ~527-551)

