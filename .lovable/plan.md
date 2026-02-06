

# Habilitar rota /fabrica/pedidos-producao para todos os usuarios

## Situacao atual

- A rota `fabrica_pedidos` ja existe na tabela `app_routes` com path `/fabrica/pedidos-producao`
- 7 de 30 usuarios ativos ja possuem acesso
- 23 usuarios precisam receber acesso

## Solucao

Criar uma migration SQL que insere registros na tabela `user_route_access` para todos os usuarios ativos que ainda nao possuem acesso a rota `fabrica_pedidos`.

```sql
INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT au.user_id, 'fabrica_pedidos', true
FROM admin_users au
WHERE au.ativo = true
  AND au.user_id NOT IN (
    SELECT ura.user_id FROM user_route_access ura WHERE ura.route_key = 'fabrica_pedidos'
  )
ON CONFLICT (user_id, route_key) DO UPDATE SET can_access = true;
```

## Resultado

Todos os 30 usuarios ativos terao `can_access = true` para a rota `fabrica_pedidos`, tornando `/fabrica/pedidos-producao` acessivel a todos.

**Arquivos:** 1 nova migration SQL
