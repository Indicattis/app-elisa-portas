
# Rota de edicao de Neo em /logistica/expedicao/editar-neo/:id

## Resumo
Criar a rota `/logistica/expedicao/editar-neo/:id` que reutiliza o mesmo componente `NovaNeoForm`, mas carrega os dados da Neo pelo ID da URL (em vez de receber via `location.state`). Atualizar os handlers de edicao na Expedicao para navegar para essa rota.

## Alteracoes

### 1. Atualizar `src/pages/logistica/NovaNeoForm.tsx`
- Aceitar parametros de rota: usar `useParams` para extrair `id`
- Aceitar query param `tipo` (instalacao ou correcao) para saber qual tabela consultar
- Quando `id` estiver presente na URL, buscar os dados da neo no banco (query por ID em `neo_instalacoes` ou `neo_correcoes`)
- Remover dependencia de `location.state` para edicao (manter retrocompativel ou substituir)
- Rota: `/logistica/expedicao/editar-neo/:id?tipo=instalacao` ou `?tipo=correcao`

### 2. Atualizar `src/App.tsx`
- Adicionar rota `/logistica/expedicao/editar-neo/:id` apontando para `NovaNeoForm`

### 3. Atualizar `src/pages/logistica/ExpedicaoMinimalista.tsx`
- Alterar `handleEditarNeoInstalacao` para fazer `navigate('/logistica/expedicao/editar-neo/' + neo.id + '?tipo=instalacao')`
- Alterar `handleEditarNeoCorrecao` para fazer `navigate('/logistica/expedicao/editar-neo/' + neo.id + '?tipo=correcao')`
- Os modais `NeoInstalacaoModal` e `NeoCorrecaoModal` podem ser mantidos para criacao ou removidos se nao forem mais usados para edicao

### Arquivos envolvidos
- `src/pages/logistica/NovaNeoForm.tsx` (adicionar busca por ID via useParams + useQuery)
- `src/App.tsx` (nova rota)
- `src/pages/logistica/ExpedicaoMinimalista.tsx` (alterar handlers de edicao para navigate)
