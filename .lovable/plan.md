
## Objetivo
Em `/direcao/gestao-fabrica`, para pedidos nas etapas **Expedição Coleta** (`aguardando_coleta`), **Instalações** (`instalacoes`) e **Correções** (`correcoes`):
1. **Remover** o botão "Finalizar Direto" (CheckCircle verde) do PedidoCard.
2. **Adicionar** um botão "Carregar Ordem" (Truck) que conclui o carregamento da ordem agendada — somente visível quando há ordem agendada (`temDataCarregamento === true`) e ainda **não** está carregada (`carregamentoConcluido === false`).
3. Após carregamento concluído, o avanço/finalização do pedido segue o fluxo natural já existente (a função `concluir_carregamento_e_avancar_pedido` já avança o pedido automaticamente para o próximo estágio).

## Mudanças

### 1. `src/components/pedidos/PedidoCard.tsx`
- Já existe a flag derivada `carregamentoConcluido`, `temDataCarregamento` e o `pedido.etapa_atual`.
- Adicionar nova prop opcional `onCarregarOrdem?: (pedido: any) => Promise<void>`.
- No bloco de botões (linhas ~2124-2143), substituir a condição do "Finalizar Direto" para:
  - **Esconder** "Finalizar Direto" quando `etapaAtual ∈ {aguardando_coleta, instalacoes, correcoes}`.
  - **Renderizar** botão "Carregar Ordem" (ícone `Truck`, cor azul) quando `onCarregarOrdem` definido, etapa for uma das três, `temDataCarregamento === true` e `carregamentoConcluido === false`.
- Abrir um diálogo de confirmação simples antes de executar (similar ao `showFinalizarDireto`).

### 2. `src/components/pedidos/PedidosDraggableList.tsx`
- Repassar a nova prop `onCarregarOrdem` para o `PedidoCard`.

### 3. `src/pages/direcao/GestaoFabricaDirecao.tsx`
- Remover/condicionar `onFinalizarDireto` para **NÃO** ser passado quando `etapa ∈ {aguardando_coleta, instalacoes, correcoes}`. Manter para as demais etapas (exceto `finalizado`, já excluído).
- Implementar `handleCarregarOrdem(pedido)` que detecta a fonte (carregamento/instalação/correção) com base em `pedido.etapa_atual`:
  - `aguardando_coleta` → buscar `ordens_carregamento.id` e chamar RPC `concluir_carregamento_e_avancar_pedido(p_ordem_carregamento_id)`.
  - `instalacoes` → buscar `instalacoes.id` (etapa de instalação ou correção, lembrando que correções vivem na mesma tabela `instalacoes` quando aplicável; verificar tabela `correcoes` separadamente) e chamar RPC `concluir_carregamento_instalacao(p_instalacao_id)`.
  - `correcoes` → atualizar `correcoes.carregamento_concluido = true` (segue padrão de `useOrdensCarregamentoUnificadas` linhas 552-558).
- Reaproveitar a lógica do hook `useOrdensCarregamentoUnificadas.concluirCarregamento`: a forma mais simples é importar esse hook e expor um wrapper que recebe um `pedido_id`, encontra a ordem unificada correspondente e dispara `concluirCarregamento(ordem)`.
- Após sucesso: invalidar queries `pedidos-producao`, `ordens_carregamento`, `ordens_instalacao`, `correcoes`, `carregamento-status-${pedido.id}`.
- Mostrar toast de sucesso/erro.

### 4. `src/components/direcao/GestaoFabricaMobile.tsx` (se aplicável)
- Aplicar a mesma lógica de remover "Finalizar Direto" e adicionar "Carregar Ordem" para as 3 etapas.

## Comportamento esperado
- Pedido em **Expedição Coleta** com data de carregamento agendada → mostra botão azul `Truck` "Carregar Ordem". Ao clicar e confirmar, a ordem é marcada como carregada, o pedido avança para `instalacoes` (ou `finalizado` se for entrega).
- Pedido em **Instalações** com data agendada → botão "Carregar Ordem" marca a instalação como carregada. (A finalização da instalação em si continua pelo fluxo de `/logistica/instalacoes`.)
- Pedido em **Correções** com data agendada → botão "Carregar Ordem" marca a correção como carregada.
- Pedidos sem ordem agendada nessas etapas → nenhum botão (apenas o de agendar, que já existe via `onAgendar`).
- O botão "Finalizar Direto" continua disponível em todas as outras etapas (Aberto, Em Produção, Inspeção, Pintura, Embalagem etc.).

## Arquivos afetados
- `src/components/pedidos/PedidoCard.tsx` (edit)
- `src/components/pedidos/PedidosDraggableList.tsx` (edit — repassar prop)
- `src/pages/direcao/GestaoFabricaDirecao.tsx` (edit — handler + condicionar onFinalizarDireto)
- `src/components/direcao/GestaoFabricaMobile.tsx` (edit, se renderiza os mesmos botões)

Sem migrações de banco — todas as RPCs e tabelas necessárias já existem.
