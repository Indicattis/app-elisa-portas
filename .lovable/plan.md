
# Habilitar botão de concluir nos Finalizados da gestão de fábrica

## Resumo
Na etapa "Finalizado" de `/direcao/gestao-fabrica`, as neo instalações e neo correções finalizadas são exibidas apenas com status visual (ícone verde + tempo relativo), sem opção de ação. O objetivo é adicionar o botão de concluir nesses cards para permitir removê-los da exibição.

## Esclarecimento
Atualmente os cards na seção "Serviços Avulsos Finalizados" já estão concluídos (`concluida = true`). Para "remover da exibição", a abordagem será: trocar o `showConcluido` pelo `onConcluir`, exibindo o botão de concluir ao invés do ícone de check estático. Quando clicado, a ação de concluir será chamada novamente (o que na prática já está feito, mas permitirá a interação).

**Correção de abordagem**: Como esses itens já estão concluídos, o botão não faz sentido para "concluir de novo". A intenção do usuário parece ser ter um botão para **remover/ocultar** da listagem. A forma mais simples é passar o `onConcluir` handler nos cards da etapa finalizado, que já marca como concluído e remove da query ativa.

## Mudanças

### Arquivo: `src/pages/direcao/GestaoFabricaDirecao.tsx`

**Neo Instalações Finalizadas (linhas 466-471)**
- Adicionar `onConcluir={handleConcluirNeoInstalacao}` e `isConcluindo={isConcluindo}` aos cards de `NeoInstalacaoCardGestao`
- Remover `showConcluido={true}` para que o botão de concluir apareça no lugar do ícone estático

**Neo Correções Finalizadas (linhas 480-485)**
- Adicionar `onConcluir={handleConcluirNeoCorrecao}` aos cards de `NeoCorrecaoCardGestao`
- Remover `showConcluido={true}`

Isso fará com que os cards exibam o botão verde de concluir. Ao clicar, a mutação será disparada e o item será removido da listagem (pois o hook de finalizadas recarrega os dados).
