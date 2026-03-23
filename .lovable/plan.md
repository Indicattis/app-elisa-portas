
Objetivo: corrigir o bloqueio de edição em `/administrativo/pedidos/:id` quando o pedido está na etapa `aprovacao_ceo`.

Diagnóstico
- A rota `/administrativo/pedidos/:id` usa `PedidoViewMinimalista` (não `PedidoView`).
- A correção anterior foi aplicada em outras telas, mas neste arquivo ainda está:
  - `podeEditarLinhas = isAberto || isEmProducao`
  - `podeEditarObservacoes = isAberto || isEmProducao`
- Resultado: em `aprovacao_ceo`, o `PedidoLinhasEditor` recebe `isReadOnly=true` e bloqueia alterações.

Plano de implementação
1. Ajustar permissão de edição no detalhe administrativo
- Arquivo: `src/pages/administrativo/PedidoViewMinimalista.tsx`
- Incluir flag da etapa:
  - `const isAprovacaoCeo = pedido.etapa_atual === 'aprovacao_ceo'`
- Atualizar regras:
  - `podeEditarLinhas = isAberto || isAprovacaoCeo || isEmProducao`
  - manter `podeEditarObservacoes` conforme regra de negócio atual (ou alinhar com `podeEditarLinhas` se desejado).

2. Garantir consistência visual da etapa
- Mesmo arquivo, adicionar `aprovacao_ceo` em:
  - `getEtapaLabel`
  - `getEtapaBadgeColor`
- Evita exibição crua de `aprovacao_ceo` e mantém feedback visual coerente.

3. Revisar fluxo de salvamento para essa etapa
- Confirmar que `handleSalvarAlteracoes` em `aprovacao_ceo` segue o caminho de atualização normal (sem propagação de produção), mantendo comportamento esperado para “Salvar itens”.

Validação (E2E manual)
1. Abrir pedido em `aprovacao_ceo` em `/administrativo/pedidos/:id`.
2. Validar que botões de edição dos itens aparecem (editar, adicionar, remover/duplicar).
3. Alterar quantidade/tamanho/item e salvar; confirmar persistência após refresh.
4. Verificar que etapas não permitidas continuam bloqueadas.
5. Verificar que `em_producao` mantém aviso e comportamento de propagação.

Detalhes técnicos
- Arquivo principal da correção: `src/pages/administrativo/PedidoViewMinimalista.tsx`
- Não há necessidade de alterar rota (`App.tsx`) nem listagem (`PedidosAdminMinimalista.tsx`) para este bug específico.
