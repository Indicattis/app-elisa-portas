

## Plano: Adicionar rotas recentes ao gerenciamento de permissões

### Rotas faltantes

Duas páginas criadas recentemente não estão registradas na tabela `app_routes`, portanto não aparecem em `/admin/permissions`:

| key | path | label | parent_key |
|-----|------|-------|------------|
| `marketing_midias` | `/marketing/midias` | Mídias | `marketing_hub` |
| `marketing_ltv` | `/marketing/ltv` | LTV | `marketing_hub` |

### Mudança

Uma única **migração SQL** para inserir as duas rotas na tabela `app_routes`, com `interface = 'padrao'`, `active = true`, e `parent_key = 'marketing_hub'` para ficarem agrupadas sob Marketing no painel de permissões.

```sql
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, active, sort_order)
VALUES
  ('marketing_midias', '/marketing/midias', 'Mídias', 'Image', 'padrao', 'marketing_hub', true, 54),
  ('marketing_ltv', '/marketing/ltv', 'LTV', 'Users', 'padrao', 'marketing_hub', true, 55);
```

Nenhuma alteração de código é necessária — as rotas já estão protegidas por `ProtectedRoute` com os `routeKey` correspondentes.

