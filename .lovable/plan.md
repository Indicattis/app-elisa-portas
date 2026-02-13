
# Nova Etapa: Embalagem

## Resumo
Adicionar a etapa "Embalagem" ao fluxo de producao, posicionada entre "Aguardando Pintura" e as etapas finais (Expedicao Coleta / Instalacoes). Quando o pedido chega nesta etapa, uma ordem de embalagem e criada automaticamente. Ao concluir a ordem, o pedido avanca automaticamente para a proxima etapa.

## Fluxo atualizado

```text
Aberto -> Aprovacao CEO -> Em Producao -> Inspecao Qualidade
  -> [se tem pintura] Aguardando Pintura -> Embalagem -> Expedicao Coleta / Instalacoes
  -> [se NAO tem pintura] Embalagem -> Expedicao Coleta / Instalacoes
```

A etapa Embalagem e obrigatoria para todos os pedidos (exceto manutencao), independente de ter pintura ou nao.

## Alteracoes

### 1. Banco de dados (SQL via Supabase)

**Nova tabela `ordens_embalagem`** -- seguindo o padrao de `ordens_pintura`:
- `id` UUID PK
- `pedido_id` UUID FK -> pedidos_producao
- `numero_ordem` TEXT
- `status` TEXT (pendente, em_andamento, concluido)
- `responsavel_id` UUID (user_id de quem capturou)
- `capturada_em` TIMESTAMPTZ
- `data_conclusao` TIMESTAMPTZ
- `tempo_conclusao_segundos` INT
- `historico` BOOLEAN DEFAULT false
- `prioridade` INT DEFAULT 0
- `em_backlog` BOOLEAN DEFAULT false
- `created_at`, `updated_at` TIMESTAMPTZ

**Nova funcao SQL `criar_ordem_embalagem(p_pedido_id UUID)`** -- cria a ordem e suas linhas (copiando itens do pedido para `linhas_ordens` com `tipo_ordem = 'embalagem'`), similar a `criar_ordem_pintura`.

**Habilitar RLS** na tabela `ordens_embalagem` com politicas equivalentes as de `ordens_pintura`.

### 2. Tipos e configuracao de etapas

**Arquivo: `src/types/pedidoEtapa.ts`**
- Adicionar `'embalagem'` ao type `EtapaPedido`
- Adicionar configuracao em `ETAPAS_CONFIG` com label "Embalagem", cor `bg-cyan-600`, icon `Package`, e checkboxes vazios
- Inserir `'embalagem'` em `ORDEM_ETAPAS` entre `aguardando_pintura` e `aguardando_coleta`

**Arquivo: `src/utils/pedidoFluxograma.ts`**
- Adicionar `embalagem` ao `FLUXOGRAMA_ETAPAS`
- Atualizar `determinarFluxograma` para sempre incluir embalagem antes das etapas finais

### 3. Logica de avanco de etapas

**Arquivo: `src/hooks/usePedidosEtapas.ts`**
- Adicionar `embalagem: 0` ao contador em `usePedidosContadores`
- Na logica de `moverParaProximaEtapa`:
  - Quando sai de `aguardando_pintura`: destino = `embalagem` (em vez de ir direto para coleta/instalacoes)
  - Quando sai de `inspecao_qualidade` sem pintura: destino = `embalagem`
  - Quando sai de `em_producao` (so separacao, sem pintura): destino = `embalagem`
  - Quando sai de `embalagem`: verificar `tipo_entrega` para decidir coleta vs instalacoes
  - Ao chegar em `embalagem`: chamar `criar_ordem_embalagem` via RPC
- Atualizar mapeamento de `statusInstalacao` para incluir `embalagem`

### 4. Auto-avanco

**Arquivo: `src/hooks/usePedidoAutoAvanco.ts`**
- Adicionar `'embalagem'` ao type `TipoOrdem`
- Adicionar `verificarOrdemEmbalagemConcluida` (similar a `verificarOrdemPinturaConcluida`)
- Em `tentarAvancoAutomatico`: tratar `etapaAtual === 'embalagem'` com `tipoOrdemConcluida === 'embalagem'`
- Em `verificarEAvancarManual`: adicionar case para `embalagem`
- Em `PedidoDetalhesSheet`: adicionar `embalagem` ao array de etapas que mostram botao "Verificar Avanco"

### 5. Hook de ordem de embalagem

**Novo arquivo: `src/hooks/useOrdemEmbalagem.ts`**
- Seguir o padrao de `useOrdemPintura.ts`
- Query `ordens-embalagem` buscando da tabela `ordens_embalagem`
- Mutations: `capturarOrdem`, `concluirOrdem` (avanco automatico via callback), `marcarLinhaConcluida`
- Realtime subscription em `linhas_ordens` com filtro `tipo_ordem=eq.embalagem`

### 6. Pagina de producao

**Novo arquivo: `src/pages/fabrica/producao/EmbalagemMinimalista.tsx`**
- Seguir o padrao de `PinturaMinimalista.tsx`
- Kanban com ordens pendentes e em andamento
- Sheet de detalhes com linhas e botao de conclusao
- Integracao com `usePedidoAutoAvanco` para avanco automatico

### 7. Roteamento e navegacao

**Arquivo: `src/App.tsx`**
- Importar e registrar rota `/fabrica/producao/embalagem` -> `EmbalagemMinimalista`
- Proteger com `routeKey="fabrica_embalagem"`

**Tabela `app_routes` (SQL INSERT)**:
- Inserir nova rota com `key='producao_embalagem'`, `path='/producao/embalagem'`, `interface='producao'`, `icon='Package'`, `label='Embalagem'`

**Tabela `app_route_keys` (SQL INSERT)**:
- Inserir `fabrica_embalagem` para a rota da interface fabrica

### 8. Componentes e UI de pedidos

**Arquivo: `src/components/pedidos/PedidoCard.tsx`**
- Adicionar case `embalagem` na logica de determinacao de destino (processos de avanco)
- Adicionar logica para mostrar status da ordem de embalagem

**Arquivo: `src/components/pedidos/RetrocederPedidoUnificadoModal.tsx`**
- Considerar `embalagem` como etapa valida para retrocesso

**Arquivo: `src/components/dashboard/PedidosEmProducao.tsx`**
- Adicionar mapeamento de label e cor para `embalagem`

**Arquivo: `src/pages/administrativo/PedidoViewMinimalista.tsx`**
- Adicionar `embalagem` aos mapeamentos de label e cor

**Arquivo: `src/pages/admin/AdminLogs.tsx`**
- Adicionar `embalagem` ao mapeamento de labels

**Arquivo: `src/pages/Pedidos.tsx`**
- Adicionar icone para etapa `embalagem`

### 9. Contadores de ordens

**Arquivo: `src/hooks/useOrdensCount.ts`** (se existir)
- Adicionar contagem de `ordens_embalagem` para exibir badge no hub de producao

**Arquivo: `src/hooks/useOrdensProducaoPrioridade.ts`**
- Adicionar `'embalagem'` ao type e mapeamento de tabelas

### 10. Funcao SQL de retrocesso

**Atualizar `retroceder_pedido_unificado`** para:
- Conhecer a etapa `embalagem`
- Excluir ordens de embalagem quando retroceder para etapas anteriores

## Ordem de implementacao

1. Criar tabela e funcoes SQL (banco de dados)
2. Atualizar tipos TypeScript (`pedidoEtapa.ts`, `pedidoFluxograma.ts`)
3. Atualizar logica de avanco (`usePedidosEtapas.ts`)
4. Atualizar auto-avanco (`usePedidoAutoAvanco.ts`)
5. Criar hook `useOrdemEmbalagem.ts`
6. Criar pagina `EmbalagemMinimalista.tsx`
7. Registrar rotas e navegacao (`App.tsx`, SQL inserts)
8. Atualizar componentes de UI (PedidoCard, dashboards, labels)
9. Atualizar retrocesso e prioridade
