
# Adicionar Gestao de Pedidos na interface de Producao

## Resumo

Criar um botao "Gestao de Pedidos" no hub `/producao`, uma nova pagina `/producao/gestao-pedidos` que e um clone de `PedidosProducaoMinimalista`, e registrar a rota no sistema de permissoes.

## Mudancas

### 1. Arquivo: `src/pages/ProducaoHome.tsx`

- Adicionar o icone `ClipboardList` aos imports
- Adicionar novo item no array `BOTOES` com `{ label: "Gestão de Pedidos", icon: ClipboardList, path: "/producao/gestao-pedidos", routeKey: "producao_gestao_pedidos" }`

### 2. Novo arquivo: `src/pages/producao/GestaPedidosProducao.tsx`

- Criar um componente que importa e re-exporta `PedidosProducaoMinimalista` (clone por re-uso, nao duplicacao de codigo)
- Ajustar o `backPath` do `MinimalistLayout` para apontar para `/producao` em vez de `/fabrica`
- Para isso, criar um wrapper simples que renderiza o mesmo conteudo mas dentro do layout de producao (`ProducaoLayout`)

**Alternativa mais simples**: Como `PedidosProducaoMinimalista` usa `MinimalistLayout` com backPath, criar uma nova pagina que importa os mesmos hooks e componentes, mas passando `backPath="/producao"`. Na pratica, o mais eficiente e criar um arquivo fino que simplesmente re-exporta o componente original, ja que o `MinimalistLayout` tem botao voltar generico.

### 3. Arquivo: `src/App.tsx`

- Importar o novo componente `GestaoPedidosProducao`
- Adicionar rota dentro do bloco `producao/*`:
```
<Route path="/gestao-pedidos" element={
  <ProtectedProducaoRoute routeKey="producao_gestao_pedidos">
    <ProducaoLayout><GestaoPedidosProducao /></ProducaoLayout>
  </ProtectedProducaoRoute>
} />
```

### 4. Migracao de banco de dados

Inserir a nova rota na tabela `app_routes` para que apareca em `/admin/permissions`:

```sql
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, sort_order, active)
VALUES ('producao_gestao_pedidos', '/producao/gestao-pedidos', 'Gestão de Pedidos', 'ClipboardList', 'producao', NULL, 0, true);
```

### Detalhes tecnicos

- O componente `GestaoPedidosProducao` sera essencialmente o `PedidosProducaoMinimalista` mas com `backPath="/producao"` no `MinimalistLayout`
- A permissao sera gerenciada automaticamente em `/admin/permissions` pois o `UserRouteAccessManager` le da tabela `app_routes`
- O botao no hub segue o mesmo padrao visual dos demais (glassmorphism, icone azul)
