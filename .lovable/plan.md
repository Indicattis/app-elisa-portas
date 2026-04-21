
## Regra de desconto sobre o lucro (limite 13%)

### Regra de negócio

Hoje, em `/administrativo/financeiro/faturamento/:id`, o desconto aplicado em cada produto é **integralmente subtraído do lucro tabelado** (linha 994):

```
lucroAjustado = lucro_item - desconto + crédito
```

A nova regra é: **o lucro tabelado só é reduzido pelo valor que excede 13% de desconto sobre o valor de tabela da venda**. Até 13%, o lucro tabelado permanece intacto. Acima de 13%, somente o excedente é abatido.

```text
pctDescontoTotal = totalDescontos / valorTabela * 100
excedentePct     = max(0, pctDescontoTotal - 13)
excedenteValor   = valorTabela * (excedentePct / 100)
```

O `excedenteValor` é o único valor que reduz o lucro consolidado. Distribuição entre produtos: proporcional ao desconto aplicado em cada item (item sem desconto não perde lucro; item com mais desconto absorve mais do excedente).

### Mudanças

**1. `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`**

- Adicionar cálculo de excedente sobre 13%:
  - `pctDescontoTotal`, `excedentePct`, `excedenteValor` (a partir de `valorTabela` e `totalDescontosCalc` já existentes nas linhas 710–718, 738–742).
- Substituir `totalLucro` (linha 723) para subtrair somente `excedenteValor` em vez de `totalDescontosCalc`:
  ```
  totalLucro = lucroProdutos + lucroInstalacao - excedenteValor + totalCreditosProdutos + valor_credito
  ```
- Na tabela de produtos (linhas 994 e 1011–1012), recalcular `lucroAjustado` por linha:
  - Se `excedenteValor === 0` → `lucroAjustado = lucro_item + creditoValorAbs` (sem desconto sobre lucro).
  - Se `excedenteValor > 0` → distribuir proporcionalmente: `parcelaExcedenteItem = excedenteValor * (descontoValorAbs / totalDescontosCalc)` e `lucroAjustado = lucro_item - parcelaExcedenteItem + creditoValorAbs`.
- Margem por linha continua a partir do novo `lucroAjustado`.

**2. Indicador de Excedente (novo card)**

Adicionar um 9º card no grid de indicadores financeiros (linha 882, `lg:grid-cols-8` → `lg:grid-cols-9`) chamado **"Excedente >13%"**:

- Fica em **vermelho** quando `excedentePct > 0`, mostrando `-{formatCurrency(excedenteValor)}` e abaixo o percentual excedente (ex.: `+2,4% acima de 13%`).
- Fica em cinza/“-” quando o desconto total estiver ≤ 13%.
- Tooltip/legenda curta no card explicando: “Desconto acima de 13% — abatido do lucro”.

### Resumo visual

```text
Tabela | Desc.Cartão | Desc.Gelo | Luan/Alana | Excedente>13% | Crédito | Frete | Venda | Lucro
                                              ^^^^^^^^^^^^^^^
                                              novo card vermelho
```

### Arquivos editados

- `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Nenhuma mudança de banco ou hook é necessária — o cálculo é feito no front a partir dos dados já disponíveis (`produtos`, `valor_venda`, `valorTabela`, `totalDescontosCalc`).
