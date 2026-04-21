

## Permitir alterar o método de pagamento no faturamento

Na página `/administrativo/financeiro/faturamento/:id`, atualmente o método de pagamento de cada grupo de parcelas é apenas exibido como rótulo (Boleto, À Vista, Cartão, Dinheiro, Pix). O objetivo é permitir alterar esse método diretamente, para uma parcela individual ou para o grupo inteiro.

### Comportamento

**No card "Parcelas / Contas a Receber"**, no cabeçalho de cada grupo (onde hoje aparece "Boleto 2/3 pagas R$ X"):
- Substituir o texto fixo do método por um `Select` com as opções: Boleto, À Vista, Cartão de Crédito, Dinheiro, Pix.
- Ao trocar, todas as parcelas daquele grupo recebem `update` no campo `metodo_pagamento` em `contas_receber`.
- Após salvar, os grupos são recalculados automaticamente (já que o agrupamento é feito por `metodo_pagamento`), então o grupo se funde com outro existente do mesmo método ou aparece sob o novo rótulo.
- Mostrar toast de sucesso/erro.

**Em cada linha de parcela**, adicionar um pequeno seletor de método (ícone discreto + dropdown) para casos em que o usuário queira alterar apenas uma parcela específica sem afetar o restante do grupo.

**No card "Informações de Pagamento"** (campo "Método de Pagamento" da venda):
- Tornar o campo editável via `Select` no mesmo padrão.
- Ao alterar, atualizar `vendas.metodo_pagamento` para o valor escolhido.
- Esse campo é apenas informativo do cabeçalho da venda; não altera as parcelas existentes (a alteração das parcelas é feita no card de Parcelas).

### Detalhes técnicos

- Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`.
- Reutilizar `Select` de `@/components/ui/select` com as mesmas opções já usadas em `FormaPagamentoSelect`/`MetodoPagamentoCard` (`boleto`, `a_vista`, `cartao_credito`, `dinheiro`, `pix`).
- Atualização de grupo: novo handler `handleUpdateMetodoGrupo(parcelas, novoMetodo)` que faz `update ... in (ids)` em `contas_receber` e recarrega via `fetchContasReceber()` (em vez do merge incremental do estado, para garantir o reagrupamento correto).
- Atualização de parcela única: usar o handler existente `handleUpdatePagamento(id, 'metodo_pagamento', valor)` seguido de `fetchContasReceber()` para reagrupar.
- Atualização do método na venda: novo handler que faz `update vendas set metodo_pagamento = ? where id = ?` e atualiza estado local `setVenda`.
- Sem mudanças de schema; as colunas `vendas.metodo_pagamento` e `contas_receber.metodo_pagamento` já existem.

### Fora do escopo

- Não recriar parcelas automaticamente ao trocar o método (o usuário pode usar o botão "Regenerar" existente, se desejar refazer com base nos novos dados).
- Não alterar `numero_parcelas`/`intervalo_boletos` da venda; isso continua via "Regenerar".

