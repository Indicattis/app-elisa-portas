

## Plano: Botão "Concluir Direto" (Arquivo Morto) na aba Aprovação Diretor

### O que será feito
Adicionar um botão vermelho com ícone de arquivo morto (`Archive`) no `VendaPendentePedidoCard` em `mode='pedido'` (aba Aprovação Diretor). Ao clicar, abre um Dialog informativo e, ao confirmar:
1. Cria o pedido de produção (via `createPedidoFromVenda`)
2. Imediatamente arquiva o pedido criado
3. Registra movimentação no histórico (`pedidos_movimentacoes`)

### Alterações

**1. `src/components/pedidos/VendaPendentePedidoCard.tsx`**

- Importar `Archive` do lucide-react
- Adicionar estado `showConcluirDireto` e `isConcluindoDireto`
- Adicionar handler `handleConcluirDireto`:
  - Chama `createPedidoFromVenda(venda.id)` para criar o pedido
  - Busca o `user` autenticado
  - Fecha a etapa `aprovacao_diretor` em `pedidos_etapas` (data_saida = now)
  - UPSERT na etapa `finalizado` em `pedidos_etapas`
  - Atualiza `pedidos_producao` com `etapa_atual: 'finalizado'`, `arquivado: true`, `data_arquivamento`, `arquivado_por`
  - Insere em `pedidos_movimentacoes` com `etapa_origem: 'aprovacao_diretor'`, `etapa_destino: 'finalizado'`, `teor: 'finalizacao_direta'`, `descricao: 'Pedido criado e arquivado diretamente pelo diretor'`
  - Invalida queries relevantes
- No modo `pedido`, adicionar botão vermelho (`border-red-500/50 text-red-600 hover:bg-red-500/10`) com ícone `Archive` ao lado do botão amarelo existente
- Ajustar grid columns do modo `pedido` para acomodar novo botão (adicionar coluna 30px)
- Adicionar Dialog com informações detalhadas (cliente, valor, lista de consequências: pedido será criado e imediatamente arquivado, movimentação registrada no histórico, enviado para Arquivo Morto)

### Detalhes técnicos
- Grid do modo `pedido` passa de `'20px 24px 1fr 100px 60px 50px 50px 60px 65px 80px 35px 35px 55px 70px 70px 60px 30px 30px 20px'` para incluir mais uma coluna `30px`
- O botão confirmar do Dialog será vermelho (`bg-red-600 hover:bg-red-700`)
- A criação + arquivamento acontece atomicamente no handler

### Escopo
- 1 arquivo modificado: `VendaPendentePedidoCard.tsx`

