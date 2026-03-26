

## Plano: Registrar novas rotas em `app_routes`

### Problema
As páginas "Visitas Técnicas" (`/vendas/visitas-tecnicas`) e "Leads" (`/vendas/leads`) existem no código mas não foram adicionadas à tabela `app_routes`. Por isso, não aparecem no gerenciador de permissões em `/admin/permissions`.

### Solução
Criar uma migration SQL que insere as duas rotas como sub-rotas de `vendas_hub`:

```sql
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active)
VALUES
  ('vendas_leads', '/vendas/leads', 'Leads', 'minimalista', 'vendas_hub', 7, 'UserPlus', true),
  ('vendas_visitas_tecnicas', '/vendas/visitas-tecnicas', 'Visitas Técnicas', 'minimalista', 'vendas_hub', 8, 'ClipboardCheck', true)
ON CONFLICT (key) DO UPDATE SET active = true, path = EXCLUDED.path, label = EXCLUDED.label;
```

Adicionalmente, atualizar as rotas no `App.tsx` para usar `routeKey` específico em vez do genérico `vendas_hub`:
- `/vendas/leads` → `routeKey="vendas_leads"`
- `/vendas/visitas-tecnicas` → `routeKey="vendas_visitas_tecnicas"`

E propagar o acesso automaticamente para usuários que já têm `vendas_hub`.

### Arquivos alterados
- Migration SQL (1 arquivo novo)
- `src/App.tsx` — atualizar routeKey das duas rotas

