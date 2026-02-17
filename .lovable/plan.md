
# Adicionar botao "Retornar" nas Neo finalizadas

## Resumo
Adicionar um botao nos cards de Neo (Instalacao e Correcao) na etapa "finalizado" de `/direcao/gestao-fabrica` que permite retornar o servico para a etapa ativa (instalacoes/correcoes), desfazendo a conclusao.

## O que muda para o usuario
- Ao lado do icone de conclusao (check verde) nos cards de Neo finalizados, aparecera um botao com icone de "retornar" (seta para tras)
- Ao clicar, o Neo voltara a aparecer na etapa de instalacoes ou correcoes, conforme o tipo
- O card sumira da lista de finalizados

## Alteracoes tecnicas

### 1. Hooks - criar mutations de retorno

**`src/hooks/useNeoInstalacoes.ts`** (hook `useNeoInstalacoesFinalizadas`)
- Adicionar mutation `retornarNeoInstalacao` que faz UPDATE em `neo_instalacoes`:
  - `concluida: false`
  - `concluida_em: null`
  - `concluida_por: null`
  - `status: 'pendente'`
  - `updated_at: new Date().toISOString()`
- No `onSuccess`, invalidar queries `neo_instalacoes_finalizadas`, `neo_instalacoes_listagem` e `pedidos_contadores`
- Exportar `retornarNeoInstalacao` e `isRetornando`

**`src/hooks/useNeoCorrecoes.ts`** (hook `useNeoCorrecoesFinalizadas`)
- Mesmo padrao: mutation `retornarNeoCorrecao` com os mesmos campos
- Invalidar `neo_correcoes_finalizadas`, `neo_correcoes_listagem` e `pedidos_contadores`
- Exportar `retornarNeoCorrecao` e `isRetornando`

### 2. Cards - adicionar prop e botao de retorno

**`src/components/pedidos/NeoInstalacaoCardGestao.tsx`**
- Adicionar prop `onRetornar?: (id: string) => void`
- Na secao `showConcluido` (col 19, linhas 266-284), adicionar um botao com icone `Undo2` antes do check verde
- Botao com estilo amarelo/laranja para diferenciar do concluir

**`src/components/pedidos/NeoCorrecaoCardGestao.tsx`**
- Mesmo padrao: prop `onRetornar` e botao na area de concluido

### 3. Pagina - conectar handlers

**`src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Extrair `retornarNeoInstalacao` do hook `useNeoInstalacoesFinalizadas`
- Extrair `retornarNeoCorrecao` do hook `useNeoCorrecoesFinalizadas`
- Criar handlers `handleRetornarNeoInstalacao` e `handleRetornarNeoCorrecao`
- Passar `onRetornar` para os cards de Neo na secao de finalizados (linhas 466-487)

### Arquivos envolvidos
- `src/hooks/useNeoInstalacoes.ts` (adicionar mutation de retorno no hook de finalizadas)
- `src/hooks/useNeoCorrecoes.ts` (adicionar mutation de retorno no hook de finalizadas)
- `src/components/pedidos/NeoInstalacaoCardGestao.tsx` (adicionar prop e botao)
- `src/components/pedidos/NeoCorrecaoCardGestao.tsx` (adicionar prop e botao)
- `src/pages/direcao/GestaoFabricaDirecao.tsx` (conectar handlers)
