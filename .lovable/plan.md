
# Pagina dedicada por estado em /direcao/autorizados

## Resumo

Atualmente, ao clicar em um estado na tela de autorizados, o detalhe e exibido inline (via estado local). A proposta e criar uma rota dedicada `/direcao/autorizados/estado/:estadoId` que renderiza a pagina do estado com URL propria, e atualizar os breadcrumbs em todas as paginas relacionadas para refletir a hierarquia correta.

## Estrutura de rotas

```text
/direcao/autorizados                          -> Lista de estados
/direcao/autorizados/estado/:estadoId         -> Detalhe do estado (cidades, autorizados)
/direcao/autorizados/estado/:estadoId/novo    -> Novo autorizado (pre-selecionando estado)
/direcao/autorizados/novo                     -> Novo autorizado (sem estado pre-selecionado)
/direcao/autorizados/:id/editar               -> Editar autorizado
```

## Alteracoes

### 1. Criar pagina `src/pages/direcao/EstadoAutorizadosDirecao.tsx`
- Nova pagina dedicada para o detalhe do estado
- Recebe `:estadoId` via `useParams`
- Usa o hook `useEstadosCidades` para buscar dados do estado, cidades e autorizados
- Inclui breadcrumb: Home > Direcao > Autorizados > [Nome do Estado]
- Contem os dialogs de nova cidade, editar estado, etc.
- Botao "Novo Autorizado" navega para `/direcao/autorizados/estado/:estadoId/novo`
- Botao "Editar" de cada autorizado navega para `/direcao/autorizados/:id/editar`
- Botao voltar navega para `/direcao/autorizados`

### 2. Simplificar `AutorizadosPrecosDirecao.tsx`
- Remover toda a logica de `estadoSelecionado`, `EstadoDetalheView`, dialogs de cidade
- O click no card do estado agora navega para `/direcao/autorizados/estado/${estado.id}`
- Manter apenas a listagem de estados com drag-and-drop e o dialog de novo estado

### 3. Atualizar `NovoAutorizadoDirecao.tsx`
- Aceitar query param ou rota param opcional para pre-selecionar estado
- Atualizar breadcrumb para incluir o estado quando vindo de uma pagina de estado:
  Home > Direcao > Autorizados > [Estado] > Novo
- Atualizar navegacao de volta para retornar ao estado correto

### 4. Atualizar `EditarAutorizadoDirecao.tsx`
- Buscar o estado do autorizado ao carregar
- Atualizar breadcrumb para incluir o estado:
  Home > Direcao > Autorizados > [Estado] > Editar
- Atualizar navegacao de volta para retornar ao estado correto (`/direcao/autorizados/estado/:estadoId`)

### 5. Registrar novas rotas em `App.tsx`
- Adicionar rota `/direcao/autorizados/estado/:estadoId`
- Adicionar rota `/direcao/autorizados/estado/:estadoId/novo` apontando para `NovoAutorizadoDirecao`
- Import do novo componente `EstadoAutorizadosDirecao`

### 6. Adaptar hook `useEstadosCidades.ts`
- Adicionar funcao `fetchEstadoPorId(id)` para buscar um unico estado pelo ID (usado pela pagina dedicada)
- Expor essa funcao no retorno do hook

## Detalhes tecnicos

A pagina do estado reutiliza o componente `EstadoDetalheView` existente, os dialogs `NovaCidadeDialog` e `NovoEstadoDialog`, sem duplicacao de codigo. A unica mudanca estrutural e que o estado selecionado vem da URL (`:estadoId`) em vez de estado local React.

### Arquivos

1. **Criar**: `src/pages/direcao/EstadoAutorizadosDirecao.tsx`
2. **Editar**: `src/pages/direcao/AutorizadosPrecosDirecao.tsx` -- remover logica de detalhe inline
3. **Editar**: `src/pages/direcao/NovoAutorizadoDirecao.tsx` -- breadcrumbs e navegacao contextual
4. **Editar**: `src/pages/direcao/EditarAutorizadoDirecao.tsx` -- breadcrumbs e navegacao contextual
5. **Editar**: `src/hooks/useEstadosCidades.ts` -- adicionar `fetchEstadoPorId`
6. **Editar**: `src/App.tsx` -- registrar novas rotas
