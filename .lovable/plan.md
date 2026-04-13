
Objetivo: fazer as colunas e a downbar exibirem os dados de pagamento que já existem no cadastro da venda, em vez de depender só de `contas_receber` quando isso vier vazio.

O que identifiquei
- No cadastro da venda, os dados principais são salvos na tabela `vendas`:
  - `metodo_pagamento`
  - `quantidade_parcelas`
  - `pagamento_na_entrega`
- Em `useVendasPendentePedido.ts`, a lista hoje:
  - monta método combinado via `contas_receber`
  - calcula `numero_parcelas` contando registros em `contas_receber`
  - calcula “pago na entrega” via `contas_receber.pago_na_instalacao`
- Isso explica o `—`: quando `contas_receber` não existe ainda, a venda tem os dados no cadastro, mas a aba “Pendente Pedido” não usa fallback suficiente.
- Além disso, o campo correto da venda para parcelas parece ser `quantidade_parcelas`, não apenas `numero_parcelas`.
- E para “pagamento na entrega”, o campo correto da venda é `pagamento_na_entrega`; hoje a tela está mostrando `pago_na_instalacao`, que é outra coisa.

Implementação proposta
1. Ajustar o hook `useVendasPendentePedido`
- Incluir `quantidade_parcelas` e `pagamento_na_entrega` no select de `vendas`.
- Manter a busca separada em `contas_receber` para enriquecer quando houver registros.
- Corrigir o mapeamento final com fallback nesta ordem:
  - método: combinar `v.metodo_pagamento` + métodos extras vindos de `contas_receber`
  - parcelas: `parcelasPorVenda.get(v.id) || v.quantidade_parcelas || v.numero_parcelas || null`
  - pagamento na entrega: usar `v.pagamento_na_entrega` como fonte principal para a coluna/downbar
- Se fizer sentido para manter clareza, adicionar no tipo retornado um campo dedicado como `pagamento_na_entrega: boolean | null`, em vez de reutilizar `pago_na_instalacao`.

2. Corrigir a card da lista
- Em `VendaPendentePedidoCard.tsx`, fazer a coluna “Parcelas” usar o valor final corrigido do hook.
- Trocar a coluna “Pago na entrega” para ler o campo certo derivado da venda.
- Manter a exibição de múltiplos métodos como `Boleto/Cartão`.

3. Corrigir a downbar
- Em `VendaPendenteDetalhesSheet.tsx`, usar os mesmos dados normalizados:
  - pagamento combinado
  - parcelas com fallback do cadastro da venda
  - “Pago na Entrega” baseado em `pagamento_na_entrega`
- Garantir consistência visual entre card e downbar.

4. Compatibilidade com dados existentes
- Não precisa migration.
- A correção é só de leitura/mapeamento dos campos já existentes.
- Isso deve fazer aparecer os dados mesmo antes da geração de `contas_receber`.

Arquivos a alterar
- `src/hooks/useVendasPendentePedido.ts`
- `src/components/pedidos/VendaPendentePedidoCard.tsx`
- `src/components/pedidos/VendaPendenteDetalhesSheet.tsx`

Detalhe técnico
```text
Fonte correta por campo:

Método combinado:
- vendas.metodo_pagamento
- + contas_receber.metodo_pagamento (extras)

Parcelas:
- contas_receber.count por venda
- fallback: vendas.quantidade_parcelas
- fallback final: vendas.numero_parcelas

Pagamento na entrega:
- vendas.pagamento_na_entrega
- não usar isso como sinônimo de contas_receber.pago_na_instalacao
```

Validação após implementar
- Criar/usar uma venda com pagamento salvo no cadastro, mas sem parcelas geradas ainda.
- Confirmar na etapa “Pendente Pedido”:
  - método aparece
  - parcelas aparecem
  - pagamento na entrega aparece
- Abrir a downbar e verificar os mesmos valores.
- Testar também uma venda com dois métodos para confirmar `Boleto/Cartão`.
