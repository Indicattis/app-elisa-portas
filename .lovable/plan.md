

# Adicionar botao de arquivar Neos finalizadas na Gestao de Fabrica

## Resumo

Adicionar um botao de "Arquivo Morto" nos cards de Neo Instalacoes e Neo Correcoes finalizadas na etapa "Finalizado" da gestao de fabrica. Ao clicar, a neo sera arquivada (status = 'arquivada') e desaparecera da listagem.

## Alteracoes

### 1. `src/hooks/useNeoInstalacoes.ts` - Adicionar mutation de arquivar no hook `useNeoInstalacoesFinalizadas`

Adicionar uma `arquivarMutation` que atualiza o status para `'arquivada'` e `concluida: false`, invalidando as queries relevantes. Expor `arquivarNeoInstalacao` no retorno do hook.

### 2. `src/hooks/useNeoCorrecoes.ts` - Adicionar mutation de arquivar no hook `useNeoCorrecoesFinalizadas`

Mesma logica: mutation que arquiva a neo correcao. Expor `arquivarNeoCorrecao` no retorno do hook.

### 3. `src/components/pedidos/NeoInstalacaoCardGestao.tsx` - Adicionar prop `onArquivar`

- Adicionar prop `onArquivar?: (id: string) => void` na interface
- Adicionar botao com icone Archive (laranja, mesmo padrao dos pedidos) quando `showConcluido` estiver ativo e `onArquivar` estiver definido

### 4. `src/components/pedidos/NeoCorrecaoCardGestao.tsx` - Adicionar prop `onArquivar`

Mesma alteracao: prop + botao Archive.

### 5. `src/pages/direcao/GestaoFabricaDirecao.tsx` - Conectar tudo

- Extrair `arquivarNeoInstalacao` e `arquivarNeoCorrecao` dos hooks finalizadas
- Criar handlers `handleArquivarNeoInstalacao` e `handleArquivarNeoCorrecao`
- Passar `onArquivar` nos cards de neo finalizadas (linhas 497-505 e 514-521)

## Detalhes tecnicos

A logica de arquivamento ja existe no projeto (mesmo update `status: 'arquivada', concluida: false`). O padrao visual do botao segue o mesmo icone Archive laranja usado nos pedidos finalizados.
