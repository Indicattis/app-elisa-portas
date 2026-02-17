
# Adicionar drag-and-drop nas listagens de Neos em /logistica/expedicao

## Resumo

As listagens de "Instalacoes Avulsas" e "Correcoes Avulsas" nas tabs de `/logistica/expedicao` atualmente renderizam cards estaticos sem reordenacao. O componente `NeoDraggableList.tsx` ja existe com `NeoInstalacoesDraggableList` e `NeoCorrecoesDraggableList`, e os hooks ja exportam `reorganizarNeoInstalacoes` / `reorganizarNeoCorrecoes`. Basta conectar tudo.

## Alteracoes

### 1. `src/pages/logistica/ExpedicaoMinimalista.tsx`

- Importar `NeoInstalacoesDraggableList` e `NeoCorrecoesDraggableList` de `@/components/pedidos/NeoDraggableList`
- Extrair `reorganizarNeoInstalacoes` do hook `useNeoInstalacoesListagem()` (ja existe no retorno do hook)
- Extrair `reorganizarNeoCorrecoes` do hook `useNeoCorrecoesListagem()` (ja existe no retorno do hook)
- Substituir o bloco de `neoInstalacoesListagem.map(neo => <NeoInstalacaoCardGestao .../>)` por `<NeoInstalacoesDraggableList neos={neoInstalacoesListagem} viewMode="list" onConcluir={handleConcluirNeoInstalacaoListagem} isConcluindo={isConcluindoInstalacaoListagem} onReorganizar={reorganizarNeoInstalacoes} />`
- Substituir o bloco de `neoCorrecoesListagem.map(neo => <NeoCorrecaoCardGestao .../>)` por `<NeoCorrecoesDraggableList neos={neoCorrecoesListagem} viewMode="list" onConcluir={handleConcluirNeoCorrecaoListagem} onReorganizar={reorganizarNeoCorrecoes} />`

### 2. Adicionar prop `onAgendar` ao `NeoDraggableList`

Os componentes `NeoInstalacoesDraggableList` e `NeoCorrecoesDraggableList` em `src/components/pedidos/NeoDraggableList.tsx` atualmente nao suportam a prop `onAgendar`. Sera necessario:

- Adicionar `onAgendar?: (id: string) => void` nas interfaces `NeoInstalacoesDraggableListProps` e `NeoCorrecoesDraggableListProps`
- Repassar `onAgendar` para `NeoInstalacaoCardGestao` e `NeoCorrecaoCardGestao` dentro dos maps

Isso garante que o botao de agendar continue funcionando dentro da lista com drag-and-drop.

## Impacto

- Nenhum componente novo sera criado
- Reutiliza componentes e hooks ja existentes
- O comportamento de drag-and-drop sera identico ao ja usado na gestao de fabrica
