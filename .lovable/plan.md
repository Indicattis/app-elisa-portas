
# Adicionar Quantidade Padrao ao Item Padrao de Porta de Enrolar

## O que muda

Na pagina de edicao de item de estoque (`/administrativo/compras/estoque/editar-item/:id`), quando o checkbox "Item padrao para porta de enrolar" estiver marcado, aparecera um campo numerico para definir a quantidade inserida por padrao. Se nao for informada, sera 1.

Quando um item padrao for adicionado automaticamente a um pedido, usara essa quantidade ao inves do valor fixo 1.

## Alteracoes

### 1. Banco de dados - Nova coluna

Adicionar coluna `quantidade_padrao` na tabela `estoque`:
- Tipo: `integer`
- Default: `1`
- Nullable: sim

### 2. `src/pages/administrativo/EstoqueEditMinimalista.tsx`

- Adicionar `quantidade_padrao` ao state do formulario (default 1)
- Carregar o valor do banco no `useEffect` de inicializacao
- Incluir no `dadosParaSalvar` do `handleSubmit`
- Renderizar um campo `Input` numerico logo abaixo do checkbox `item_padrao_porta_enrolar`, visivel apenas quando o checkbox estiver marcado
- Estilo consistente com a pagina: `bg-white/5 border-white/10 text-white`

### 3. `src/hooks/useEstoque.ts`

- Adicionar `quantidade_padrao` a interface `ProdutoEstoque` (tipo `number`)
- Adicionar `quantidade_padrao` a interface `ProdutoEstoqueInput` (opcional)

### 4. `src/components/pedidos/LinhasAgrupadasPorPorta.tsx`

- Incluir `quantidade_padrao` no select da query de itens padrao (linha 95)
- No `handleAdicionarItemPadrao`, substituir `quantidade: 1` por `quantidade: item.quantidade_padrao || 1`

### 5. Tipos Supabase

Os tipos serao atualizados automaticamente apos a migracao do banco.
