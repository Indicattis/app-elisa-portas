

## Plano: Botão "Enviar para Aguardando Cliente" na etapa Finalizado

### Resumo
Adicionar um botão no PedidoCard (etapa finalizado) que move o pedido para uma nova etapa oculta `aguardando_cliente`. No header da página, substituir o botão "Pedido Teste" por um botão que abre a aba dessa etapa oculta.

### O que será feito

**1. Tipo `EtapaPedido` e configuração** (`src/types/pedidoEtapa.ts`)
- Adicionar `'aguardando_cliente'` ao tipo `EtapaPedido`
- Adicionar config em `ETAPAS_CONFIG` (label: "Aguardando Cliente", cor: amarelo, icon: Clock)
- NÃO adicionar em `ORDEM_ETAPAS` (etapa oculta, fora do fluxo normal)

**2. Contadores** (`src/hooks/usePedidosEtapas.ts`)
- Adicionar `aguardando_cliente: 0` no objeto `counts` do `usePedidosContadores`

**3. Botão no PedidoCard** (`src/components/pedidos/PedidoCard.tsx`)
- Adicionar prop `onEnviarAguardandoCliente?: (pedidoId: string) => Promise<void>`
- Na etapa `finalizado`, adicionar botão com ícone (Clock ou UserMinus) ao lado dos existentes (correção, arquivar)
- Ao clicar, mostra AlertDialog de confirmação e executa a ação

**4. Prop no PedidosDraggableList** (`src/components/pedidos/PedidosDraggableList.tsx`)
- Passar `onEnviarAguardandoCliente` do PedidosDraggableList para cada PedidoCard

**5. Lógica de envio** (`src/pages/direcao/GestaoFabricaDirecao.tsx`)
- Criar `handleEnviarAguardandoCliente`: atualiza `etapa_atual` para `'aguardando_cliente'`, fecha a etapa finalizado em `pedidos_etapas`, cria entrada `aguardando_cliente` em `pedidos_etapas`, registra movimentação
- Passar a função para `PedidosDraggableList` via prop

**6. Aba oculta no header** (`src/pages/direcao/GestaoFabricaDirecao.tsx`)
- Substituir o botão "Pedido Teste" por um botão "Aguardando Cliente" com badge de contagem
- Ao clicar, definir `etapaAtiva` como `'aguardando_cliente'`
- Ajustar `etapaParaQuery` para tratar `'aguardando_cliente'` corretamente (usar `usePedidosEtapas('aguardando_cliente' as EtapaPedido)`)
- Adicionar `TabsContent` para essa etapa com a listagem dos pedidos
- Manter botão "Pedido Teste" — mover para dentro da aba ou como segundo botão

**7. Botão de retorno** 
- Na aba `aguardando_cliente`, os pedidos terão botão para "Retornar para Finalizado" (atualiza `etapa_atual` de volta para `'finalizado'`)

### Detalhes técnicos
- `etapa_atual` é `string` no banco — não precisa de migration
- `pedidos_etapas` usa UPSERT com `onConflict: 'pedido_id,etapa'`
- A etapa não aparece nas tabs normais, apenas é acessível pelo botão no header

