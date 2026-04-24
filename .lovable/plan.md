## Objetivo

Garantir que o menu suspenso de perfil — incluindo o seletor de tema (Claro/Escuro/Sistema) — esteja disponível em **todas** as páginas do site, exceto:
- Painéis (`/paineis/*`, `PaineisLayout`)
- Páginas de login (`/auth`, `/producao/login`, `/forbidden`, `ForbiddenProducao`)

## Diagnóstico atual

Hoje o `FloatingProfileMenu` (componente que recebeu o seletor de tema) só está incluído manualmente em ~36 páginas "hub minimalistas" (ex.: `VendasHub`, `FabricaHub`, `MarketingHub`, `AdministrativoHub`, `LogisticaHub`, `DirecaoHub`, etc.). As demais páginas usam um destes três cabeçalhos, **nenhum dos quais possui o seletor de tema**:

1. **`HeaderUserInfo`** em `src/App.tsx` (linhas 359–421) — usado no layout global com `AppSidebar`. Cobre praticamente todas as páginas "internas" não-minimalistas (VendaNova, Faturamento, Pedidos, Estoque, Vagas, Caixa, etc.). Tem avatar visível mas botões soltos (Tarefas, Settings, Sair) — sem dropdown e sem tema.
2. **`AdminHeader`** em `src/components/admin/AdminHeader.tsx` — usado no `AdminLayout` (rotas `/admin/*` que usam o layout). Sem dropdown e sem tema.
3. **`AdminHub`** (`src/pages/admin/AdminHub.tsx`) — tem dropdown próprio inline, mas sem tema.
4. **`ProducaoLayout`** — cabeçalho próprio para `/producao/*` (sem tema, mas usuário não excluiu produção; manteremos).

Conclusão: precisamos adicionar o seletor de tema (e padronizar para um menu suspenso) em todos esses cabeçalhos, em vez de espalhar `<FloatingProfileMenu />` em centenas de páginas.

## Estratégia

Em vez de adicionar `<FloatingProfileMenu />` página por página, vamos **embutir o mesmo dropdown (com seletor de tema)** nos cabeçalhos compartilhados que já cobrem as páginas. Isso garante cobertura universal sem regressões.

### Etapas

1. **Extrair um componente reutilizável `ProfileDropdownMenu`** a partir do conteúdo do dropdown atual de `FloatingProfileMenu.tsx`:
   - Conteúdo: header com nome/email + "Meu Perfil" + atalhos (Produção, Painéis, Admin com checagem de permissão) + Sair + bloco "Tema" (Claro/Escuro/Sistema usando `useTheme`).
   - O `FloatingProfileMenu` continua existindo e passa a renderizar o novo `ProfileDropdownMenu` (sem mudança visual onde já é usado).

2. **`HeaderUserInfo` (em `src/App.tsx`)** — substituir o avatar atual por um `Avatar` clicável que abre o `ProfileDropdownMenu`. Manter o botão de Tarefas existente. Remover os botões soltos de Settings/Sair (já estarão no dropdown). Isso cobre todas as páginas que usam o `AppSidebar` global (a grande maioria do sistema).

3. **`AdminHeader` (`src/components/admin/AdminHeader.tsx`)** — mesmo tratamento: o avatar passa a abrir o `ProfileDropdownMenu`. Cobre as rotas `/admin/*` que usam o `AdminLayout`.

4. **`AdminHub` (`src/pages/admin/AdminHub.tsx`)** — substituir o dropdown inline customizado (que atualmente só tem "Painéis" e "Sair") pelo `ProfileDropdownMenu`, mantendo o posicionamento flutuante atual.

5. **`ProducaoLayout`** — adicionar o `ProfileDropdownMenu` no cabeçalho (ou um `FloatingProfileMenu` se for preferível manter o estilo). Usuário não excluiu produção, então incluímos.

6. **Páginas avulsas sem qualquer layout** — após as alterações acima, restam pouquíssimas páginas sem cabeçalho compartilhado (ex.: `Index.tsx`, `NotFound.tsx`, telas standalone como `TvDashboard`, `PedidoPreparacao`). Vamos:
   - **Manter sem menu**: `Index`, `NotFound`, `Auth`, `Forbidden`, `ForbiddenProducao`, `ProducaoLogin`, `TvDashboard` (display público), `Painéis`.
   - Para o restante (se houver alguma página standalone protegida), incluiremos `<FloatingProfileMenu />` diretamente.

### Exclusões confirmadas

- `PaineisLayout` e tudo sob `/paineis/*` — **não** receberá o menu.
- `Auth.tsx`, `ProducaoLogin.tsx`, `Forbidden.tsx`, `ForbiddenProducao.tsx` — **não** receberão.

## Resultado esperado

Após a implementação, qualquer página autenticada do sistema (fora Painéis) exibirá um avatar no topo que, ao ser clicado, abre o mesmo dropdown padronizado contendo Meu Perfil, atalhos com permissão, Sair e o seletor de tema (Claro/Escuro/Sistema) que persiste em `localStorage` via `ThemeProvider`.

## Arquivos a serem alterados

- **Novo**: `src/components/ProfileDropdownMenu.tsx` (extração do conteúdo do dropdown)
- **Editado**: `src/components/FloatingProfileMenu.tsx` (passa a usar o novo componente)
- **Editado**: `src/App.tsx` (`HeaderUserInfo` passa a abrir o dropdown)
- **Editado**: `src/components/admin/AdminHeader.tsx`
- **Editado**: `src/pages/admin/AdminHub.tsx`
- **Editado**: `src/components/ProducaoLayout.tsx` (adicionar dropdown no cabeçalho)

Posso prosseguir com a implementação?