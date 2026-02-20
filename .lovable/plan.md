

# Corrigir botao de Arquivar no PedidoCard

## Problema

O botao de arquivar abre corretamente o `ArquivarPedidoModal` (AlertDialog), porem o clique tambem propaga para o `Card` pai (linha 1027), que abre o `PedidoDetalhesSheet`. Como o Sheet e um overlay de tela cheia, ele cobre o AlertDialog de confirmacao, dando a impressao de que o botao nao funciona.

Apesar do `e.stopPropagation()` no onClick do botao, a cadeia `Tooltip > TooltipTrigger asChild > Button` pode nao estar propagando o stop corretamente em todos os casos.

## Solucao

### Alteracao em `src/components/pedidos/PedidoCard.tsx`

No `onClick` do Card (linha 1027), adicionar uma verificacao para nao abrir o Sheet de detalhes quando um modal ja estiver sendo aberto. Isso pode ser feito de duas formas -- a mais robusta e:

1. **No onClick do Card (linhas 1027-1033)**: Verificar se `showArquivar` (ou outros modais) esta ativo antes de abrir detalhes. Porem, como o state muda assincronamente, a melhor abordagem e:

2. **Envolver a area dos botoes de acao em um div com `onClick={e => e.stopPropagation()}`**: Adicionar um wrapper ao redor da coluna dos botoes de acao (que inclui o botao de arquivar) para garantir que qualquer clique nessa area nao propague para o Card. Isso ja e feito no drag handle (linha 1040) mas nao na area dos botoes.

Especificamente, no container `div` que envolve os botoes de acao (proximo da linha 1520-1525), adicionar `onClick={(e) => e.stopPropagation()}` para bloquear a propagacao de qualquer botao daquela area.

## Resultado

- Clicar no botao de arquivar abrira apenas o modal de confirmacao de arquivamento
- O Sheet de detalhes nao abrira simultaneamente
- O comportamento de clicar em outras areas do Card para abrir detalhes continuara funcionando normalmente
