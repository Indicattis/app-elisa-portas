

# Corrigir botão de calendário na etapa Instalações

## Problema

Na página `/direcao/gestao-fabrica`, o botão de calendário na etapa "Instalações" abre um calendário completo em modo leitura (`CalendarioInstalacoesModal`), mas o comportamento esperado é mostrar um **input de data** para agendar o carregamento de um pedido — similar ao fluxo do `SelecionarPedidoInstalacaoModal`.

## Solução

Substituir a abertura do `CalendarioInstalacoesModal` pelo `SelecionarPedidoInstalacaoModal`, que já existe e faz exatamente o que o usuário precisa: mostra um date picker para selecionar a data e lista os pedidos disponíveis para agendar instalação naquela data.

## Mudanças

### Arquivo: `src/pages/direcao/GestaoFabricaDirecao.tsx`

1. Remover o import e o estado `showCalendarioInstalacoesModal`
2. Remover o componente `CalendarioInstalacoesModal` da renderização
3. Importar `SelecionarPedidoInstalacaoModal` de `@/components/instalacoes/SelecionarPedidoInstalacaoModal`
4. Adicionar estado `showSelecionarPedidoInstalacao` (boolean)
5. No botão de calendário da etapa `instalacoes`, trocar para abrir `SelecionarPedidoInstalacaoModal` com `dataSelecionada` = hoje
6. Renderizar o `SelecionarPedidoInstalacaoModal` com callback `onPedidoSelecionado` que invalida as queries para atualizar a lista

### Arquivo: `src/components/instalacoes/SelecionarPedidoInstalacaoModal.tsx`

7. Adicionar um **date picker** (usando o componente Shadcn Calendar/Popover) dentro do modal para que o usuário possa alterar a data de agendamento antes de selecionar o pedido, em vez de depender apenas da `dataSelecionada` passada como prop

### Resultado esperado

Ao clicar no ícone de calendário na etapa "Instalações":
- Abre um modal com um campo de data editável (date picker)
- Lista os pedidos em `expedicao_instalacao` disponíveis para instalação
- Ao selecionar um pedido, cria a instalação na data escolhida

### Detalhes técnicos

O `SelecionarPedidoInstalacaoModal` já faz insert na tabela `instalacoes` e update no `pedidos_producao.data_producao`. O date picker será adicionado entre o título e a lista de pedidos, usando `Popover` + `Calendar` do Shadcn com `pointer-events-auto`.

O `CalendarioInstalacoesModal` criado anteriormente pode ser mantido no código caso seja útil futuramente, mas não será mais usado nesta página.
