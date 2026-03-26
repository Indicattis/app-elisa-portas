

## Plano: Adicionar "Visitas Técnicas" ao hub de Vendas

### Objetivo
Criar um novo botão "Visitas Técnicas" no hub `/vendas` e uma nova página que lista os anexos de fichas de visita técnica dos pedidos, agrupados por venda (cliente).

### Dados disponíveis
A tabela `pedidos_producao` já possui as colunas `ficha_visita_url`, `ficha_visita_nome` e `venda_id`. Basta consultar pedidos que tenham `ficha_visita_url IS NOT NULL` e agrupar pelo `venda_id` + `cliente_nome`.

### Alterações

**1. `src/pages/vendas/VendasHub.tsx`**
- Importar ícone `ClipboardCheck` do lucide-react
- Adicionar item ao array `menuItems`: `{ label: 'Visitas Técnicas', icon: ClipboardCheck, path: '/vendas/visitas-tecnicas' }`

**2. Nova página `src/pages/vendas/VisitasTecnicas.tsx`**
- Query Supabase: `pedidos_producao` filtrando `ficha_visita_url` not null, selecionando `id, numero_pedido, cliente_nome, venda_id, ficha_visita_url, ficha_visita_nome, created_at`
- Agrupar resultados por `venda_id` (ou `cliente_nome` quando `venda_id` é null)
- Exibir cards colapsáveis por cliente/venda, cada um listando os pedidos com links para abrir/baixar a ficha de visita
- Incluir campo de busca por nome do cliente
- Layout responsivo seguindo o padrão existente (fundo escuro, breadcrumb, botão voltar)

**3. `src/App.tsx`**
- Importar `VisitasTecnicas` com lazy loading
- Adicionar rota: `<Route path="/vendas/visitas-tecnicas" element={<ProtectedRoute routeKey="vendas_hub"><VisitasTecnicas /></ProtectedRoute>} />`

### Arquivos alterados
- `src/pages/vendas/VendasHub.tsx` — novo item no menu
- `src/pages/vendas/VisitasTecnicas.tsx` — nova página (criação)
- `src/App.tsx` — nova rota

