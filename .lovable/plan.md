## Diagnóstico

O pedido `0301` (`65e1bd74-05a0-44a6-8438-ab146a3f61c6`) tem um item `tipo_produto = 'porta_social'`, mas:

- `ordens_terceirizacao` para esse pedido: **0 registros** ✅ (correto — terceirização só vale para itens com `tipo_fabricacao = 'terceirizado'`, e a porta social está marcada como `interno`)
- `ordens_porta_social` para esse pedido: **0 registros** ❌ (deveria existir — porta social tem fluxo próprio)

**Causa raiz:** a função SQL `criar_ordens_producao_automaticas(uuid)` em produção foi sobrescrita por uma versão que só gera ordens de **soldagem, perfiladeira e separação**. Os blocos que criavam `ordens_porta_social` e `ordens_terceirizacao` (presentes na migração `20260105130122`) foram removidos em alguma migração mais recente e nunca recolocados. Resultado: todo pedido com porta social entra em produção sem a ordem do setor de Porta Social ser criada.

## O que será feito

### 1. Migração SQL — restaurar geração de `ordens_porta_social`

Atualizar `criar_ordens_producao_automaticas(p_pedido_id uuid)` adicionando, ao final do corpo atual (sem mexer na lógica existente de soldagem/perfiladeira/separação):

- Detectar se a venda vinculada possui algum produto com `tipo_produto = 'porta_social'`.
- Se sim e ainda não existir uma `ordens_porta_social` para o pedido, gerar número via `gerar_numero_ordem('porta_social')` e inserir uma nova ordem com `status = 'pendente'`, herdando `em_backlog` e `prioridade_etapa` do pedido.
- Idempotente: usa `NOT EXISTS` antes de inserir, então re-execuções não duplicam.

Não será incluída a criação de `ordens_terceirizacao` nesse momento — conforme decidido, porta social tem fluxo próprio e não dispara terceirização. A lógica de terceirização baseada em `tipo_fabricacao = 'terceirizado'` continua valendo para itens explicitamente marcados como tal no catálogo.

### 2. Correção pontual do pedido 0301

Como o pedido já está em `instalacoes` (passou da etapa de produção sem a ordem ser gerada), executar um `INSERT` único em `ordens_porta_social` para esse pedido (usando `gerar_numero_ordem('porta_social')`, status `pendente` ou `concluido` — ver pergunta abaixo).

### 3. Validação pós-deploy

- Conferir no banco que `ordens_porta_social` foi criada para o pedido `0301`.
- Verificar a página `/direcao/pedidos/65e1bd74-...` para confirmar que a ordem aparece nas listagens.
- Listar outros pedidos antigos com `tipo_produto = 'porta_social'` na venda mas sem `ordens_porta_social` — relatar quantidade encontrada para você decidir se quer correção em massa.

## Detalhes técnicos

- **Arquivo:** nova migração em `supabase/migrations/`.
- **Função alterada:** `public.criar_ordens_producao_automaticas(uuid)` — `CREATE OR REPLACE FUNCTION` mantendo `SECURITY DEFINER` e `SET search_path = public`.
- **Tabelas tocadas:** `ordens_porta_social` (insert idempotente).
- **Não toca:** RLS, triggers, demais funções, frontend.
- **Frontend:** nenhuma mudança necessária — `PedidoCard.tsx`, `PedidoView.tsx`, etc. já leem `ordens_porta_social` corretamente.

## Pergunta antes de implementar

O pedido 0301 já está na etapa `instalacoes` (passou por produção, qualidade, embalagem, carregamento). Ao gerar agora a `ordens_porta_social` para ele, qual status usar?

- **`concluido`** com `data_conclusao = now()` — assume que a porta social foi tratada manualmente fora do sistema; cria apenas o registro histórico.
- **`pendente`** — a fábrica precisa efetivamente capturar e concluir essa ordem agora (mesmo o pedido estando em instalação).

Vou perguntar isso depois que você aprovar este plano.
