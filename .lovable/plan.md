

## Plano: Adicionar coluna Desconto/Crédito no card de vendas pendentes

### O que será feito

Adicionar uma coluna no card que mostra o valor de desconto e/ou crédito aplicados na venda, entre as colunas "Pago na Entrega" e "Valor Venda".

### Alterações

**1. `src/hooks/useVendasPendentePedido.ts`**
- Adicionar campos `desconto_valor`, `desconto_percentual`, `tipo_desconto`, `valor_produto`, `valor_pintura`, `valor_instalacao` no select de `produtos_vendas`
- Adicionar campo `valor_desconto_total: number` no tipo `VendaPendentePedido`
- Calcular o desconto total somando os descontos de cada produto no mapeamento final

**2. `src/components/pedidos/VendaPendentePedidoCard.tsx`**
- Atualizar `gridTemplateColumns` para incluir nova coluna (~55px) para "Desc/Créd"
- Adicionar coluna entre "Pago na Entrega" e "Valor Venda" mostrando:
  - Se tem desconto: valor em vermelho com badge
  - Se tem crédito (`valor_credito > 0`): valor em azul
  - Se tem ambos: mostrar os dois
  - Se nenhum: exibir "—"

**3. `src/components/pedidos/VendaPendenteDetalhesSheet.tsx`**
- Adicionar info de desconto/crédito na downbar para consistência

### Detalhe técnico

```text
Cálculo do desconto por produto:
- tipo_desconto === 'valor': desconto_valor
- tipo_desconto === 'percentual': (valor_produto + valor_pintura + valor_instalacao) * quantidade * (desconto_percentual / 100)

Exibição na coluna:
- Desconto > 0: "-R$ X" em vermelho
- Crédito > 0: "+R$ X" em azul  
- Ambos: tooltip com detalhes, exibe o maior
```

