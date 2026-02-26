

# Botao "Gerar Parcelas" na secao de Contas a Receber

## O que sera feito

Reorganizar a secao "Parcelas / Contas a Receber" para:

1. **Remover** o botao "+ Parcela" do header da secao
2. **Quando nao houver parcelas**: exibir um estado vazio centralizado com botao "Gerar Parcelas" que cria automaticamente as contas a receber com base nos dados de pagamento da venda (metodo, numero de parcelas, intervalo, valor, data)
3. **Quando houver parcelas**: manter o grid atual e exibir os botoes "+ Parcela" e "Remover" no header como ja funciona

## Mudancas

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

**1. Adicionar funcao `handleGerarParcelas`** (ao lado de `handleAddParcela`):
- Usa os campos da venda: `metodo_pagamento`, `numero_parcelas`/`quantidade_parcelas`, `intervalo_boletos`, `valor_venda`, `data_venda`
- Segue a mesma logica de `gerarContasReceberPorMetodo` do `useVendas.ts`:
  - Boleto: N parcelas com intervalo personalizado
  - Cartao: N parcelas com intervalo de 30 dias
  - Dinheiro/A Vista/Pix: 1 parcela unica
- Insere os registros na tabela `contas_receber` e atualiza o estado local

**2. Reorganizar o header da Card** (linhas 860-880):
- Remover o botao "+ Parcela" do header quando `contasReceber.length === 0`
- Mostrar os botoes "+ Parcela" e "Remover" no header apenas quando `contasReceber.length > 0`

**3. Adicionar estado vazio** dentro do `CardContent` (apos linha 882):
- Quando `contasReceber.length === 0`: exibir div centralizado com icone, texto explicativo e botao "Gerar Parcelas"
- Quando `contasReceber.length > 0`: manter o conteudo atual (grid agrupado por metodo, validacao de totais)

## Visual esperado

Sem parcelas:
```text
+------------------------------------------+
| Parcelas / Contas a Receber              |
|                                          |
|        [icone CreditCard]                |
|   Nenhuma parcela cadastrada             |
|   Gere as parcelas com base nos          |
|   dados de pagamento da venda            |
|                                          |
|       [  Gerar Parcelas  ]               |
+------------------------------------------+
```

Com parcelas:
```text
+------------------------------------------+
| Parcelas / Contas a Receber  [+] [lixo]  |
|                                          |
|  Boleto (1/3 pagas)          R$ 3.000    |
|  [Parc 1] [Parc 2] [Parc 3]             |
|  ...                                     |
+------------------------------------------+
```
