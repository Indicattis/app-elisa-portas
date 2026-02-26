

# Comprovante obrigatorio ao marcar "Ja Pago"

## Resumo

Quando o usuario marca "Ja foi pago?" em qualquer metodo de pagamento, o campo de upload de comprovante sera exibido e sera obrigatorio para finalizar a venda.

## Mudancas

### 1. MetodoPagamentoCard.tsx - Exibir upload de comprovante quando "Ja pago" estiver marcado

- Atualmente o upload de comprovante so aparece para o tipo `a_vista`
- Mover/duplicar o bloco de upload de comprovante para que apareca sempre que `ja_pago === true`, independente do tipo de pagamento
- Para `a_vista`, o comprovante continua aparecendo sempre (ja e o comportamento atual)
- Para os demais tipos (`boleto`, `cartao_credito`, `dinheiro`), o upload aparece somente quando `ja_pago` estiver marcado
- O label muda para "Comprovante de Pagamento *" (com asterisco) quando `ja_pago` e `true`

### 2. useVendas.ts - Validacao e upload para qualquer metodo pago

- Adicionar validacao: se `ja_pago === true` e `comprovante_file === null`, bloquear a finalizacao com mensagem de erro
- Expandir a logica de upload de comprovante (atualmente restrita a `a_vista`) para processar o arquivo de qualquer metodo que tenha `ja_pago === true`

