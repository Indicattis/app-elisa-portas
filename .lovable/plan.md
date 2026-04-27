## Problema identificado

Ao verificar `SelecionarAcessoriosModal.tsx` (modal usado para adicionar acessórios/adicionais/manutenção em vendas), confirmei que:

- O campo `tamanho` **é salvo** no banco quando o usuário o digita.
- **Porém, não é obrigatório.** Se o usuário selecionar um item medido em Metro/Kg/Litro e clicar em "Adicionar" sem preencher o tamanho, o item é gravado com `tamanho = ''` (string vazia) e `valor_produto = preço base` (sem multiplicar pelo tamanho).

Foi exatamente isso que aconteceu na venda `2d33704b...` — 109 linhas de "Meia cana lisa - 0,70mm" sem tamanho registrado.

## Solução

Tornar o tamanho **obrigatório** para itens com unidade decimal (Metro / Kg / Litro) no modal de seleção de acessórios/adicionais/manutenção, garantindo que esse problema não se repita.

### Mudanças em `src/components/vendas/SelecionarAcessoriosModal.tsx`

1. **Validação no `handleConfirmar`**: antes de montar a lista de produtos, verificar se todos os itens selecionados que são decimais (`metro`, `kg`, `litro`) possuem `tamanhos[item.id]` preenchido e `> 0`. Se algum estiver faltando, exibir `toast.error` listando o(s) item(ns) com tamanho pendente e abortar.

2. **Feedback visual no input de tamanho**: quando o item está selecionado, é decimal e o tamanho está vazio/zero, aplicar borda destacada (ex.: `border-destructive`) no `Input` de tamanho para indicar que o campo é obrigatório.

3. **Desabilitar botão "Adicionar"** quando houver pelo menos um item decimal selecionado sem tamanho válido (mesma checagem usada na validação), além da condição atual `itensSelecionados.size === 0`.

4. **Placeholder/label**: trocar o placeholder `"0,00"` por algo mais explícito como `"obrigatório"` quando o item é decimal e está selecionado.

### Pontos não alterados

- A estrutura do banco (`produtos_vendas.tamanho`) permanece a mesma.
- Os 109 itens já existentes na venda `2d33704b...` continuam pendentes — eles precisam ser corrigidos separadamente (assunto da conversa anterior, aguardando sua decisão sobre qual tamanho aplicar).
- O fluxo de portas (que usa `largura x altura`) e itens não-decimais (unidade) não são afetados.

## Resultado esperado

A partir desta alteração, será **impossível** salvar uma venda com item de catálogo decimal sem informar o tamanho — eliminando a recorrência do problema em vendas futuras.
