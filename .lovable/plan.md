

# Adicionar preview de parcelas na secao Informacoes de Pagamento

## O que sera feito

Expandir a secao "Informacoes de Pagamento" para incluir uma tabela/grid com o detalhamento das parcelas previstas (numero, data de vencimento, valor), calculadas a partir dos dados de pagamento da venda (metodo, numero de parcelas, intervalo, valor total, data da venda). Tambem adicionar campos extras como "Pagamento na Entrega", "Valor de Entrada" e "Data da Venda".

## Mudancas

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

1. **Ampliar o fetch da venda** para incluir campos adicionais: `pagamento_na_entrega`, `valor_entrada`, `valor_a_receber`, `quantidade_parcelas`

2. **Atualizar a interface Venda** com os novos campos opcionais

3. **Adicionar informacoes extras no grid existente**:
   - Data da Venda (formatada)
   - Pagamento na Entrega (Sim/Nao com badge)
   - Valor de Entrada (se houver)

4. **Adicionar preview de parcelas calculadas** abaixo do grid de informacoes:
   - Calcular parcelas com base em: `metodo_pagamento`, `numero_parcelas`/`quantidade_parcelas`, `intervalo_boletos`, `valor_venda`, `data_venda`
   - Logica:
     - Boleto: N parcelas com intervalo personalizado em dias
     - Cartao: N parcelas com intervalo de 30 dias
     - Dinheiro/A Vista: 1 parcela unica
   - Exibir em grid responsivo (similar ao PagamentoSection): numero da parcela, data de vencimento (dd/MM/yy), valor formatado em BRL
   - Titulo: "Parcelas Previstas"

## Secao visual esperada

```text
+----------------------------------------------------------+
| Informacoes de Pagamento                                 |
|                                                          |
| Metodo: Boleto   Parcelas: 3   Intervalo: 30d           |
| Data Venda: 15/02/2026   Pgto na Entrega: Nao           |
|                                                          |
| Parcelas Previstas:                                      |
| [1a: 15/02/26 - R$ 1.000,00] [2a: 17/03/26 - R$ 1.000] |
| [3a: 16/04/26 - R$ 1.000,00]                            |
|                                                          |
| Comprovante: arquivo.pdf [Visualizar]                    |
+----------------------------------------------------------+
```

## Detalhes tecnicos

- A logica de calculo de parcelas segue o mesmo padrao de `calcularPreviewParcelas` em `PagamentoSection.tsx` e `gerarContasReceberPorMetodo` em `useVendas.ts`
- Usa `addDays` do date-fns (ja importado) para calcular datas
- O valor total usado e `venda.valor_venda`
- A data base e `venda.data_venda`
- Estilo consistente: `bg-white/5`, `border-white/10`, `text-white/60` para os cards de parcela
