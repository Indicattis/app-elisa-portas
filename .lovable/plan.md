
# Adição Direta de Itens com Cálculo Automático

## Resumo

Alterar o fluxo do modal de adição de linhas para que, ao selecionar um produto do estoque, o item seja adicionado **imediatamente** com tamanho e quantidade já calculados, sem passar pelo formulário intermediário de edição manual.

## Fluxo Atual vs Novo

```text
ATUAL:
  Clica "Adicionar" na porta
  -> Abre modal -> Busca produto -> Seleciona
  -> Formulário manual (nome, qtd, tamanho pré-preenchidos)
  -> Clica "Adicionar" novamente

NOVO:
  Clica "Adicionar" na porta
  -> Abre modal -> Busca produto -> Seleciona
  -> Item adicionado direto com valores calculados (toast de confirmação)
  -> Modal permanece aberto para adicionar mais itens
  -> Opção "Adicionar Manualmente" continua disponível para casos especiais
```

## Alterações

### 1. AdicionarLinhaModal.tsx - Adição direta ao selecionar

- Na função `handleSelecionarProduto`, em vez de chamar `setModoManual(true)` e preencher o formulário, chamar diretamente `onAdicionar()` com os valores calculados (tamanho e quantidade).
- Exibir `toast.success` com o nome do produto e valores calculados.
- Manter o modal aberto após adicionar (para permitir adicionar múltiplos itens em sequência).
- Manter a opção "Adicionar Produto Manualmente" como fallback, preservando o formulário manual atual.
- Remover o estado `modoManual` do fluxo principal de seleção de estoque (só ativar para adição manual).
- Passar `indice_porta` como nova prop para incluir na linha adicionada.

### 2. LinhasAgrupadasPorPorta.tsx - Passar indice_porta ao modal

- Guardar o `indicePorta` da porta selecionada além do `portaId`.
- Passar `indicePorta` como nova prop ao `AdicionarLinhaModal`.

### Arquivos modificados

1. `src/components/pedidos/AdicionarLinhaModal.tsx` - lógica de adição direta
2. `src/components/pedidos/LinhasAgrupadasPorPorta.tsx` - passar indice_porta ao modal
