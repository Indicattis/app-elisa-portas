

# Integrar configuracao de custos abaixo do grid de meses

## Resumo

Mover todo o conteudo de configuracao de tipos de custos (categorias, subcategorias, tipos) que estava em `CustosMinimalista.tsx` para dentro da pagina `CustosGridMinimalista.tsx`, exibindo-o logo abaixo do grid de 12 meses. Isso elimina a necessidade de navegar para uma pagina separada (`/configurar`).

## Mudancas

### 1. `src/pages/administrativo/CustosGridMinimalista.tsx`

- Importar o hook `useTiposCustos` e todos os componentes necessarios (Dialog, Table, Badge, Switch, Tabs, etc.)
- Adicionar todos os estados de formularios, dialogs e filtros que existem em `CustosMinimalista.tsx`
- Adicionar todas as funcoes handler (save, edit, delete, toggle) de categorias, subcategorias e tipos de custos
- Abaixo do grid de meses, renderizar a secao completa de configuracao:
  - Cards resumo (categorias ativas, tipos cadastrados, limite total mensal)
  - Filtros e tabela de tipos de custos
  - Botoes "Gerenciar Categorias" e "Novo Tipo de Custo"
  - Todos os dialogs (tipo custo, categoria, subcategoria, gerenciador de categorias, confirmacao de exclusao)
- Remover o botao "Configurar Tipos" do header que navegava para `/configurar`

### 2. `src/App.tsx`

- Remover a rota `/administrativo/financeiro/custos/configurar` pois a configuracao agora fica na mesma pagina

### 3. `src/pages/administrativo/CustosMinimalista.tsx`

- Pode ser mantido como arquivo mas nao sera mais referenciado por nenhuma rota (ou pode ser removido)

## Resultado

O usuario vera na pagina `/administrativo/financeiro/custos`:
1. Grid 3x4 com os meses do ano (topo)
2. Secao de configuracao de tipos de custos (abaixo do grid), com tabela, filtros, e botoes para gerenciar categorias/subcategorias/tipos

