

## Plano: Adicionar comentário obrigatório ao enviar pedido para correção

### Objetivo
Ao clicar no botão roxo de "Enviar para Correção" na aba finalizado, abrir um modal com campo de comentário (textarea) para o usuário descrever o motivo. O comentário será salvo na tabela `pedido_comentarios` e exibido abaixo do nome do cliente no card (já existe essa funcionalidade via `ultimoComentario`).

### Alterações

**1. `src/components/pedidos/EnviarCorrecaoModal.tsx`**
- Trocar de `AlertDialog` para `Dialog` (para suportar textarea)
- Adicionar campo `Textarea` para descrição/motivo da correção
- Adicionar state local para o comentário
- Alterar `onConfirmar` para receber o comentário como parâmetro: `onConfirmar(comentario: string)`
- Desabilitar botão "Confirmar" se comentário estiver vazio

**2. `src/components/pedidos/PedidoCard.tsx`**
- Atualizar as 2 chamadas de `EnviarCorrecaoModal` (linhas ~1910 e ~2396) para:
  - Receber o `comentario` no `onConfirmar`
  - Inserir o comentário na tabela `pedido_comentarios` antes de chamar `enviarParaCorrecao`

**3. `src/hooks/useEnviarParaCorrecao.ts`**
- Adicionar campo opcional `descricaoMovimentacao` ao `EnviarParaCorrecaoParams`
- Usar esse campo na `descricao` da movimentação (linha 83) em vez do texto fixo

### Resultado
O comentário aparece automaticamente abaixo do nome do cliente no card, pois a query `ultimoComentario` já busca o último registro de `pedido_comentarios`.

### Arquivos alterados
- `src/components/pedidos/EnviarCorrecaoModal.tsx`
- `src/components/pedidos/PedidoCard.tsx`
- `src/hooks/useEnviarParaCorrecao.ts`

