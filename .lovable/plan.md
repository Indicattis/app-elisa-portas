

## Plano: Mover conteúdo de /administrativo/producao para /administrativo/pedidos

### O que será feito
Mover a seção "Itens Pendentes por Etapa" (collapsibles com agrupamento por etapa/item) de `ProducaoAdminReadOnly` para baixo das tabs em `PedidosAdminMinimalista`, e remover a rota `/administrativo/producao`.

### Alterações

**1. `src/pages/administrativo/PedidosAdminMinimalista.tsx`**
- Importar `useItensNaoConcluidosPorEtapa`, `Collapsible`, `Table`, e ícones necessários
- Adicionar a lógica de agrupamento `itensAgrupadosPorEtapa` (copiada de `ProducaoAdminReadOnly`)
- Renderizar a seção "Itens Pendentes por Etapa" abaixo do bloco `</Tabs>`, com os collapsibles por etapa contendo tabela de itens agrupados

**2. `src/App.tsx`**
- Remover o import de `ProducaoAdminReadOnly`
- Remover a `<Route>` de `/administrativo/producao`

**3. `src/pages/administrativo/AdministrativoHub.tsx`**
- Remover o item "Produção" do array `menuItems`

**4. Excluir `src/pages/administrativo/ProducaoAdminReadOnly.tsx`**

### Arquivos alterados
- `src/pages/administrativo/PedidosAdminMinimalista.tsx` (adicionar seção)
- `src/App.tsx` (remover rota)
- `src/pages/administrativo/AdministrativoHub.tsx` (remover menu item)
- `src/pages/administrativo/ProducaoAdminReadOnly.tsx` (excluir)

