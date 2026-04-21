

## Sessão dedicada de Pagamento no Faturamento

Substituir os campos avulsos atuais ("Método de Pagamento", "Número de Parcelas", "Intervalo entre Boletos", "Pgto na Entrega", "Valor de Entrada", "Valor a Receber") na página `/administrativo/financeiro/faturamento/:id` por uma seção dedicada de pagamento, no mesmo padrão visual e funcional usado em `/vendas/minhas-vendas/nova`.

### Comportamento

**Card "Forma de Pagamento" (novo, dedicado)**, posicionado logo após o card "Informações da Venda":

- Reusar o componente `PagamentoSection` (`src/components/vendas/PagamentoSection.tsx`) — o mesmo da tela de nova venda.
- Suporta os mesmos recursos:
  - Método único ou dois métodos simultâneos (entrada + saldo).
  - Para cada método: tipo (Boleto, À Vista/PIX, Cartão de Crédito, Dinheiro), valor, número de parcelas, intervalo de boletos, empresa receptora, data de pagamento, marcação "Já Pago".
  - Toggle "Pagamento na Entrega".
- Estado inicial preenchido a partir dos campos atuais da venda (`metodo_pagamento`, `numero_parcelas`, `intervalo_boletos`, `valor_entrada`, `valor_a_receber`, `pagamento_na_entrega`, `empresa_receptora_id`).
- Botão **"Salvar Forma de Pagamento"** ao final do card. Ao salvar:
  1. Atualiza a venda (`vendas`) com os campos consolidados (mesmo mapeamento usado em `usePedidoCreation`/criação de venda).
  2. Pergunta via diálogo de confirmação se o usuário deseja **regenerar as parcelas** com base no novo plano (reaproveitando o `handleRegenerarParcelas` existente). Se confirmar, deleta `contas_receber` da venda e gera novas a partir dos métodos. Se recusar, mantém parcelas atuais (apenas o cabeçalho da venda é atualizado).
- Mensagem informativa: "Alterações aqui podem regenerar as parcelas. Para ajustes finos, use o card Parcelas abaixo."

**Card "Informações de Pagamento" (atual)**:
- Removido — seus dados migram para o novo card de Forma de Pagamento.
- O que **não** é forma de pagamento (Tipo de Venda — Quente/Gelo, Data da Venda, Comprovante) sai dali e vai para o card "Informações da Venda" (ou continua num card próprio "Outras Informações", para não inflar o card principal).

**Card "Parcelas / Contas a Receber" (atual)**:
- Mantido como está, incluindo os seletores de método por grupo e por linha já implementados. Continua sendo o lugar para edição fina parcela a parcela.

### Detalhes técnicos

- Arquivo principal alterado: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`.
- Importar `PagamentoSection`, `PagamentoData`, `createEmptyPagamentoData` de `@/components/vendas/PagamentoSection`.
- Novo estado local `pagamentoData: PagamentoData`, inicializado em um `useEffect` quando `venda` carrega:
  - Se `venda.valor_entrada > 0` e `venda.valor_a_receber > 0` → `usar_dois_metodos = true`, método 1 = entrada (valor `valor_entrada`, tipo derivado de `metodo_pagamento` da venda ou `a_vista`), método 2 = saldo (`valor_a_receber`, `numero_parcelas`, `intervalo_boletos`, tipo `metodo_pagamento`).
  - Caso contrário, método único com `tipo = metodo_pagamento`, `valor = valor_venda + valor_credito`, `parcelas = numero_parcelas`, `intervalo = intervalo_boletos`, `empresa_receptora_id`.
  - `pagamento_na_entrega = venda.pagamento_na_entrega`.
- Novo handler `handleSalvarFormaPagamento`:
  - Faz `update vendas set metodo_pagamento, numero_parcelas, intervalo_boletos, valor_entrada, valor_a_receber, pagamento_na_entrega, empresa_receptora_id where id = ?` consolidando a partir de `pagamentoData` (mesma lógica que `VendaNovaMinimalista` usa ao montar `vendaData`).
  - Após sucesso, abre `AlertDialog` "Regenerar parcelas?" → confirma chama `handleRegenerarParcelas()`, cancela só atualiza `setVenda`.
- Remover, do bloco "Informações de Pagamento" atual, todos os campos que passam para `PagamentoSection` (Método, Nº Parcelas, Intervalo, Pgto na Entrega, Valor Entrada, Valor a Receber). Manter Tipo de Venda, Data da Venda e Comprovante movidos para outro card existente (ou renomear o card atual para "Outras Informações").
- O handler `handleUpdateMetodoVenda` criado anteriormente fica obsoleto e pode ser removido (a edição passa por `handleSalvarFormaPagamento`).
- Sem mudanças de schema; todos os campos já existem em `vendas` e `contas_receber`.

### Fora do escopo

- Não alterar o card "Parcelas / Contas a Receber" nem os seletores por linha/grupo já existentes.
- Não criar novas tabelas ou colunas.

