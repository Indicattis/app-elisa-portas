

# Pedido de Correção a partir de Vendas

## Resumo
Criar uma nova página `/vendas/minhas-vendas/correcao` acessível via botão "Pedido de Correção" ao lado de "Nova Venda" em MinhasVendas. O fluxo permite selecionar um pedido de referência, cadastrar produtos (mesma interface da venda), adicionar observação, e ao concluir exige senha master. Em vez de criar uma venda, cria diretamente um `pedido_producao` com `is_correcao=true`.

## Arquivos a criar

### 1. `src/pages/vendas/PedidoCorrecaoNovo.tsx`
Nova página com:
- **Seletor de pedido referência**: input de busca que consulta `pedidos_producao` (por número ou nome do cliente), exibindo número do pedido e cliente. Ao selecionar, preenche automaticamente os dados do cliente.
- **Seção de produtos**: reutiliza `ProdutoVendaForm`, `ProdutosVendaTable`, `SelecionarAcessoriosModal` — mesma interface da venda.
- **Campo de observações**: textarea para descrever o motivo da correção.
- **Botão "Criar Pedido de Correção"**: ao clicar, abre modal de senha master.
- **Modal de senha master**: input de senha, valida contra `configuracoes_vendas.senha_master` usando `useConfiguracoesVendas().verificarSenhaMaster()`.
- **Ao confirmar**: usa lógica do `useCriarPedidoCorrecao` expandida — cria o `pedido_producao` com `is_correcao=true`, `pedido_origem_id`, e insere os produtos na tabela `produtos_vendas` vinculados à `venda_id` do pedido original (ou cria as linhas do pedido diretamente).
- Estilo: mesmo padrão glassmorphism/minimalista de `VendaNovaMinimalista`.

### 2. `src/hooks/useCriarPedidoCorrecaoCompleto.ts`
Hook expandido que além de criar o pedido (como `useCriarPedidoCorrecao`), também insere os produtos na tabela `produtos_vendas` vinculados à venda do pedido original, para que o pedido tenha seus próprios itens.

## Arquivos a modificar

### 3. `src/pages/vendas/MinhasVendas.tsx` (~linha 409-420)
Adicionar botão "Pedido de Correção" com estilo purple ao lado do botão "Nova Venda" no `headerActions`.

### 4. `src/App.tsx` (~linha 432)
Adicionar rota: `<Route path="/vendas/minhas-vendas/correcao" element={...}><PedidoCorrecaoNovo /></Route>`

## Fluxo do usuário
1. Clica "Pedido de Correção" em Minhas Vendas
2. Busca e seleciona o pedido de referência
3. Adiciona produtos (portas, acessórios, etc.)
4. Escreve observação do motivo
5. Clica "Criar Pedido de Correção"
6. Insere senha master no modal
7. Sistema valida senha → cria pedido → redireciona para visualização do pedido

