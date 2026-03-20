

## Plano: Criar página LTV no Marketing Hub

### O que é
Nova página `/marketing/ltv` acessível pelo hub de Marketing, exibindo o **Lifetime Value** de todos os clientes cadastrados. O LTV será calculado a partir dos dados já existentes nas tabelas `clientes` e `vendas`.

### Mudanças

**1. `src/pages/marketing/MarketingHub.tsx`**
- Adicionar novo item no array `menuItems`: `{ label: "LTV", icon: Users, path: "/marketing/ltv", ativo: true }`
- Importar ícone `Users` do lucide-react

**2. Criar `src/pages/marketing/LtvMinimalista.tsx`** (nova página)
- Usar `MinimalistLayout` com title "LTV" e subtitle "Lifetime Value dos clientes"
- Buscar todos os clientes ativos (`clientes`) e todas as vendas (`vendas`) via Supabase
- Calcular por cliente: total de vendas (LTV), número de compras, ticket médio, primeira e última compra
- Exibir cards de resumo no topo: LTV médio, LTV total, total de clientes, ticket médio geral
- Tabela com colunas: Cliente, Nº Compras, Primeira Compra, Última Compra, Ticket Médio, LTV (total gasto)
- Ordenação padrão por LTV decrescente
- Busca por nome de cliente
- Estilo glassmorphism consistente com as demais páginas do marketing

**3. `src/App.tsx`**
- Adicionar rota: `<Route path="/marketing/ltv" element={<ProtectedRoute routeKey="marketing_ltv"><LtvMinimalista /></ProtectedRoute>} />`
- Importar o componente `LtvMinimalista`

### Dados utilizados
- `clientes` (id, nome, created_at) — já existe
- `vendas` (cliente_id, valor_venda, data_venda) — já existe
- Não precisa de migração de banco

### Estrutura da página

```text
┌─────────────────────────────────────────┐
│  MinimalistLayout (LTV)                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │LTV   │ │LTV   │ │Total │ │Ticket│   │
│  │Médio │ │Total │ │Client│ │Médio │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                         │
│  [Busca por cliente]                    │
│  ┌─────────────────────────────────────┐│
│  │ Cliente │ Compras │ 1ª │ Última │...││
│  │─────────│─────────│────│────────│...││
│  │ João    │ 5       │ ...│ ...    │...││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

