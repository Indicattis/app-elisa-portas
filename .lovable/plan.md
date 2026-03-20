

## Plano: Conceder acesso às rotas LTV e Mídias

### Contexto
5 usuários já possuem acesso a rotas de marketing. Vamos conceder acesso a `marketing_ltv` e `marketing_midias` para todos eles.

### Mudança
Uma operação de **INSERT** na tabela `user_route_access` para criar 10 registros (5 usuários × 2 rotas), usando `ON CONFLICT` para evitar duplicatas.

```sql
INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT DISTINCT user_id, new_route.key, true
FROM user_route_access
CROSS JOIN (VALUES ('marketing_ltv'), ('marketing_midias')) AS new_route(key)
WHERE route_key LIKE 'marketing%' AND can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;
```

Nenhuma alteração de código necessária.

