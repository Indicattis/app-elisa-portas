
# Adicionar botao "Funcoes" no hub RH/DP e criar pagina de gerenciamento

## O que sera feito

1. Adicionar um novo botao "Funcoes" no hub `/administrativo/rh-dp` que direciona para `/administrativo/rh-dp/funcoes`.
2. Criar uma nova pagina no estilo minimalista para cadastrar e gerenciar funcoes (cargos) dos colaboradores, usando a tabela `system_roles` existente.
3. Registrar a rota no `App.tsx`.

## Detalhes tecnicos

### 1. Editar: `src/pages/administrativo/RhDpHub.tsx`

- Adicionar novo item no array `menuItems` com icone `Tag` (ou `BadgeCheck`), path `/administrativo/rh-dp/funcoes` e `ativo: true`.
- O grid desktop passara de 3 para 4 colunas (`grid-cols-4`).

### 2. Criar: `src/pages/administrativo/FuncoesPage.tsx`

Pagina minimalista usando `MinimalistLayout` (mesmo padrao de `AdminRolesMinimalista.tsx`) com:

- Lista de funcoes vindas da tabela `system_roles` (campos: key, label, setor, descricao, ativo, ordem).
- Contagem de colaboradores por funcao (query em `admin_users`).
- Botao "Nova Funcao" no header abrindo modal de criacao (reutilizando `CreateRoleModal`).
- Botao "Editar" por funcao abrindo modal de edicao (reutilizando `EditRoleModal`).
- Botao "Ver" por funcao abrindo dialog com lista de colaboradores ativos com aquele cargo.
- Breadcrumb: Home > Administrativo > RH/DP > Funcoes.
- `backPath` apontando para `/administrativo/rh-dp`.

Essencialmente sera uma versao da `AdminRolesMinimalista.tsx` com breadcrumb e backPath ajustados para o contexto de RH/DP.

### 3. Editar: `src/App.tsx`

- Importar `FuncoesPage` (lazy import).
- Adicionar rota: `/administrativo/rh-dp/funcoes` com `routeKey="administrativo_hub"`, seguindo o padrao das demais rotas de RH/DP.

## Arquivos modificados

1. **Editar**: `src/pages/administrativo/RhDpHub.tsx` -- adicionar item "Funcoes" ao menu
2. **Criar**: `src/pages/administrativo/FuncoesPage.tsx` -- pagina de gerenciamento de funcoes
3. **Editar**: `src/App.tsx` -- registrar nova rota
