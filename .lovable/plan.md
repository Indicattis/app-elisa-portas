

# Adicionar botao de duplicar nas linhas do pedido

## O que sera feito

Adicionar um botao "Duplicar" ao lado dos botoes de "Editar" e "Remover" em cada linha do editor de pedidos. Ao clicar, uma nova linha sera criada com os mesmos dados (produto, quantidade, tamanho, porta, categoria).

## Detalhes tecnicos

### Arquivo: `src/components/pedidos/PedidoLinhasEditor.tsx`

1. **Importar icone** `Copy` do `lucide-react` (linha 5)

2. **Criar funcao `handleDuplicarLinha`** que recebe uma `PedidoLinha` e chama `onAdicionarLinha` com os mesmos dados:
   - `produto_venda_id`, `indice_porta`, `nome_produto`, `descricao_produto`, `quantidade`, `tamanho`, `estoque_id`, `categoria_linha`

3. **Adicionar botao na area de acoes** (linhas 524-536), entre o botao de editar e o de remover:
   ```text
   <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
     onClick={() => handleDuplicarLinha(linha)}
     title="Duplicar">
     <Copy className="h-3.5 w-3.5 text-muted-foreground" />
   </Button>
   ```

Nenhum outro arquivo precisa ser alterado.

