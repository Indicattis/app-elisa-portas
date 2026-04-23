

## Pausar / Despausar ordens em /direcao/gestao-fabrica (Em Produção)

Hoje, na aba **Em Produção** da gestão de fábrica, cada `PedidoCard` mostra um círculo de status por setor (Soldagem / Perfiladeira / Separação / Qualidade / Pintura / Embalagem). Ordens pausadas já aparecem em laranja com ícone `PauseCircle` e tooltip da justificativa, mas **não há ação** para o usuário pausar ou despausar a partir daí. Vou adicionar essas duas ações ao tooltip do círculo, reusando 100% da lógica já existente nos hooks de produção e o `AvisoFaltaModal`.

Escopo: **apenas as ordens da etapa Em Produção** — Soldagem, Perfiladeira e Separação (que é o que o usuário pediu). Qualidade/Pintura/Embalagem ficam fora porque pertencem a outras etapas e já têm fluxos próprios.

### Comportamento

No tooltip de cada círculo de ordem (em `renderOrdemStatus` dentro de `PedidoCard.tsx`), quando o card está sendo renderizado em `/direcao/gestao-fabrica` (`isDirecao === true`) e o `tipo_ordem` é `soldagem | perfiladeira | separacao`:

- **Se a ordem NÃO está pausada e existe**: botão **"Pausar"** (ícone `PauseCircle`, vermelho/destrutivo) que abre o `AvisoFaltaModal` já existente, carregando as `linhas_ordens` da ordem (mesma query usada na sheet operacional). Ao confirmar, chama a mutation de pausa.
- **Se a ordem ESTÁ pausada**: botão **"Retomar"** (ícone `PlayCircle`, primário) abaixo da justificativa no tooltip. Ao clicar, despausa a ordem (`pausada=false`, `pausada_em=null`, `justificativa_pausa=null`) sem alterar `tempo_acumulado_segundos` nem capturar — fica disponível para qualquer operador retomar.

Tooltips do shadcn não fecham ao clicar dentro — vamos converter o trigger de "pausada" e "capturada" para `Popover` quando `isDirecao` for `true`, mantendo `Tooltip` no resto dos casos (não-Direção continua exatamente como está hoje).

### Mudanças

**1. `src/lib/pausarOrdemProducao.ts` (novo)** — extrair a lógica de pausa/despausa em funções puras, reutilizáveis e testáveis, espelhando a mutation existente em `useOrdemProducao.ts`:
- `pausarOrdemProducao({ supabase, ordemId, tipoOrdem, justificativa, linhasProblemaIds, comentarioPedido, pedidoId })`
  - Marca linhas selecionadas com `com_problema=true` em `linhas_ordens`.
  - Lê `capturada_em` + `tempo_acumulado_segundos`, calcula `tempoSessao` via `calcularTempoExpediente`.
  - Atualiza tabela (`ordens_soldagem | ordens_perfiladeira | ordens_separacao`) com `pausada=true`, `pausada_em`, `justificativa_pausa`, `tempo_acumulado_segundos`, `responsavel_id=null`, `linha_problema_id=primeira`.
  - Se `comentarioPedido` informado, insere em `pedido_comentarios` (mesmo padrão do `useOrdemEmbalagem`).
- `despausarOrdemProducao({ supabase, ordemId, tipoOrdem })`
  - Atualiza apenas `pausada=false`, `pausada_em=null`, `justificativa_pausa=null` — preserva tempo acumulado, `responsavel_id` continua null (qualquer operador pode capturar).

**2. `src/hooks/useGestaoOrdensProducao.ts` (novo)** — hook fino que expõe duas mutations (`pausarOrdem`, `despausarOrdem`) chamando as funções acima e invalidando `['pedidos-etapas']`, `['ordens-producao']`, `['pedido-ordens-status']`. Toasts de sucesso/erro.

**3. `src/components/pedidos/PedidoCard.tsx`**
- Importar `useGestaoOrdensProducao` e usar quando `isDirecao`.
- Em `renderOrdemStatus(ordem, nomeSetor)`:
  - Quando `isDirecao` e `tipo_ordem ∈ {soldagem, perfiladeira, separacao}`, trocar o `Tooltip` (caso pausada e caso capturada) por um `Popover` com:
    - Bloco informativo idêntico ao tooltip atual (responsável + linhas concluídas, ou justificativa).
    - Botão **"Retomar ordem"** (se pausada).
    - Botão **"Pausar ordem"** (se não pausada e existe).
  - Para ordens não capturadas/sem responsável (`AlertCircle` amarelo), também envolver com Popover oferecendo apenas "Pausar" — útil para a Direção sinalizar uma ordem aguardando que tem problema.
- Adicionar estado local `avisoFaltaOpen` + `ordemParaPausar` para controlar `<AvisoFaltaModal>` no nível do card.
- Carregar linhas da ordem sob demanda quando o modal abrir (query `linhas_ordens` por `ordem_id` e `tipo_ordem`).
- Ao confirmar: `pausarOrdem.mutateAsync({ ordemId, tipoOrdem, justificativa, linhasProblemaIds, comentarioPedido, pedidoId })`.
- Ao retomar: `despausarOrdem.mutateAsync({ ordemId, tipoOrdem })`.

**4. `src/hooks/usePedidosEtapas.ts`** — incluir `tempo_acumulado_segundos`, `capturada_em`, `pausada_em` nos selects das três tabelas (soldagem/perfiladeira/separacao) e propagar nos objetos `pedido.ordens.{setor}`. O `ordem_id` e `tipo_ordem` já existem.

### Banco

Sem migration. Reutiliza colunas e tabelas existentes:
- `ordens_soldagem | ordens_perfiladeira | ordens_separacao`: `pausada`, `pausada_em`, `justificativa_pausa`, `tempo_acumulado_segundos`, `responsavel_id`, `capturada_em`, `linha_problema_id`.
- `linhas_ordens`: `com_problema`, `problema_reportado_em`, `problema_reportado_por`.
- `pedido_comentarios`.

### Fora de escopo

- Pintura, embalagem, qualidade (cada uma tem seu próprio painel/etapa).
- Reorganizar/redesenhar o tooltip atual em telas que não são da Direção.
- Tela de retomada com captura simultânea (a ordem fica liberada para o próximo operador capturar normalmente).

### Arquivos

- `src/lib/pausarOrdemProducao.ts` (criar)
- `src/hooks/useGestaoOrdensProducao.ts` (criar)
- `src/components/pedidos/PedidoCard.tsx` (editar)
- `src/hooks/usePedidosEtapas.ts` (editar)

