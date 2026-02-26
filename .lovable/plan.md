

# Adicionar botao "Gerar Contas a Receber" na pagina de faturamento da venda

## O que sera feito

Adicionar um botao na pagina `/administrativo/financeiro/faturamento/:id` que gera automaticamente as parcelas de contas a receber baseado nos dados de pagamento da venda (forma_pagamento, numero_parcelas, intervalo_boletos, etc). O botao so aparece quando nao existem contas a receber ainda para a venda.

## Mudancas

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

1. **Ampliar o fetch da venda** para incluir os campos de pagamento necessarios: `forma_pagamento`, `metodo_pagamento`, `numero_parcelas`, `intervalo_boletos`, `empresa_receptora_id`, `data_venda`, `valor_entrada`, `quantidade_parcelas`

2. **Atualizar a interface Venda** com os novos campos

3. **Criar funcao `handleGerarContasReceber`** que:
   - Usa os dados de pagamento da venda (metodo, parcelas, intervalo) para gerar registros na tabela `contas_receber`
   - Segue a mesma logica da funcao `gerarContasReceberPorMetodo` existente em `useVendas.ts`
   - Suporta boleto (N parcelas com intervalo), cartao (N parcelas mensais), dinheiro (1 parcela), a_vista (1 parcela ja paga)
   - Apos inserir, recarrega a lista de contas a receber com `fetchContasReceber()`

4. **Adicionar botao na secao "Parcelas / Contas a Receber"**, ao lado do botao "+ Parcela":
   - Visivel apenas quando `contasReceber.length === 0`
   - Texto: "Gerar Parcelas"
   - Icone: `Receipt`
   - Estilo: botao outline com cor azul (consistente com o tema da pagina)
   - Ao clicar, executa `handleGerarContasReceber` e exibe toast de sucesso/erro

5. **Adicionar estado `isGerandoParcelas`** para feedback visual (loading) no botao

## Logica de geracao

```text
metodo_pagamento da venda -> tipo de parcela:
- "boleto" -> N parcelas (numero_parcelas), intervalo de dias (intervalo_boletos)
- "cartao_credito" -> N parcelas (numero_parcelas), intervalo 30 dias
- "dinheiro" -> 1 parcela, status pendente
- "a_vista" -> 1 parcela, status pago
- fallback -> 1 parcela com valor total, status pendente
```

Valor base: `venda.valor_venda`
Data base: `venda.data_venda`

