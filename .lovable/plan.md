
# Pagina Dedicada de Cadastro de Neos

## Objetivo
Criar uma pagina `/logistica/neos` dedicada a listar, criar e editar Neo Instalacoes e Neo Correcoes em um unico lugar, separado do calendario de expedicao.

## Estrutura da pagina

A pagina usara o `MinimalistLayout` com backPath `/logistica` e tera:

1. **Header** com titulo "Servicos Neo" e botao "+ Novo" (dropdown com opcoes "Neo Instalacao" e "Neo Correcao")
2. **Tabs** para alternar entre "Instalacoes", "Correcoes" e "Todos"
3. **Tabela/Lista** exibindo os registros com colunas: Cliente, Cidade/Estado, Responsavel, Etapa Causadora, Valor Total, Valor a Receber, Status, Data, Acoes (editar/excluir)
4. **Modais** reutilizando os componentes existentes `NeoInstalacaoModal` e `NeoCorrecaoModal`

## Detalhes tecnicos

### 1. Nova pagina: `src/pages/logistica/NeosCadastro.tsx`
- Usa `MinimalistLayout` com breadcrumb Home > Logistica > Servicos Neo
- Usa os hooks existentes `useNeoInstalacoesListagem` e `useNeoCorrecoesListagem` para buscar dados
- Reutiliza `NeoInstalacaoModal` e `NeoCorrecaoModal` para criar/editar
- Tabs com Radix UI (`@radix-ui/react-tabs`) para filtrar por tipo
- Cada linha tera botoes de editar e excluir com confirmacao

### 2. Rota no App.tsx
- Adicionar rota `/logistica/neos` com `routeKey="logistica_hub"`
- Importar o componente com lazy loading seguindo o padrao existente

### 3. Link no Hub de Logistica
- Adicionar item "Servicos Neo" no array `menuItems` de `LogisticaHub.tsx` com icone `Wrench` ou `Hammer`

### 4. Funcionalidades da lista
- Exibir badge colorido para diferenciar Instalacao (laranja) e Correcao (roxo)
- Mostrar etapa causadora formatada (label legivel)
- Botao de editar abre o modal correspondente preenchido
- Botao de excluir com dialog de confirmacao
- Indicador visual de status (pendente, agendada, concluida)

### Arquivos envolvidos
- `src/pages/logistica/NeosCadastro.tsx` (novo)
- `src/App.tsx` (nova rota)
- `src/pages/logistica/LogisticaHub.tsx` (novo item no menu)
