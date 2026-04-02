

## Plano: Corrigir etapa de pedidos de manutenção

### Problema
Pedidos de manutenção são criados com `etapa_atual = 'aguardando_instalacao'`, uma etapa que não existe no sistema de abas (`ORDEM_ETAPAS`), tornando-os invisíveis em `/direcao/gestao-fabrica`.

### Solução

**1. Corrigir dado existente** (via insert tool)
- Atualizar o pedido `62ceb7ba-33bc-4cbf-8f7c-16ecd1ecceb6` de `aguardando_instalacao` para `instalacoes`

**2. Corrigir código de criação** (`src/hooks/usePedidoCreation.ts`)
- Alterar `etapaInicial` de `'aguardando_instalacao'` para `'instalacoes'` quando `apenasManutencao = true`
- Alterar `statusInicial` de `'aguardando_instalacao'` para `'instalacoes'`

### Arquivos alterados
- `src/hooks/usePedidoCreation.ts` (1 linha)
- UPDATE no banco (1 registro)

