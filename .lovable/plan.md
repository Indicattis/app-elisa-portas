
# Adicionar botao de Excluir Pedido na pagina PedidoViewDirecao

## Problema
A pagina de detalhes do pedido em `/direcao/pedidos/:id` nao possui opcao para excluir o pedido. A funcionalidade de exclusao ja existe no hook `usePedidosEtapas` (funcao `deletarPedido` que chama a RPC `deletar_pedido_completo`), mas nao esta acessivel nesta pagina.

## Solucao
Adicionar um botao "Excluir Pedido" na secao "Acoes Rapidas" da pagina, com modal de confirmacao usando o componente `ExcluirPedidoModal` ja existente.

## Alteracoes

### `src/pages/direcao/PedidoViewDirecao.tsx`

1. Importar dependencias necessarias:
   - `Trash2` do lucide-react
   - `ExcluirPedidoModal` de `@/components/pedidos/ExcluirPedidoModal`
   - `supabase` para chamar a RPC de exclusao
   - `useNavigate` de react-router-dom
   - `toast` de sonner

2. Adicionar estados:
   - `showExcluir` (boolean) para controlar o modal
   - `isExcluindo` (boolean) para loading

3. Criar funcao `handleExcluirPedido`:
   - Verificar se usuario e admin (via `admin_users`)
   - Chamar `supabase.rpc('deletar_pedido_completo', { p_pedido_id: id })`
   - Em caso de sucesso, exibir toast e navegar de volta para `/direcao/gestao-fabrica`

4. Adicionar botao vermelho "Excluir Pedido" na secao "Acoes Rapidas" (apos o botao "Imprimir PDF", por volta da linha 527)

5. Renderizar `ExcluirPedidoModal` passando os dados do pedido formatados para compatibilidade com o componente (que espera `vendas.cliente_nome` e `numero_pedido`)

### Arquivo afetado
- `src/pages/direcao/PedidoViewDirecao.tsx` (unico arquivo, ~30 linhas adicionadas)
