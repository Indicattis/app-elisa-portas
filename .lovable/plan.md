

## Diagnóstico: Duas rotas "Catálogo" duplicadas

Existem duas entradas na tabela `app_routes` com o label "Catálogo" dentro de `vendas_hub`:

| key | path | sort_order |
|-----|------|------------|
| `vendas_catalogo_minimalista` | `/vendas/catalogo` | 5 |
| `vendas_catalogo` | `/dashboard/vendas/vendas-catalogo` | 13 |

Uma é a rota antiga (`/dashboard/vendas/vendas-catalogo`) e a outra é a versão mais recente (`/vendas/catalogo`). Ambas estão ativas e com `interface = 'padrao'`, por isso aparecem duplicadas.

## Solução

Criar uma migration que desativa a rota obsoleta:

```sql
UPDATE app_routes SET active = false WHERE key = 'vendas_catalogo';
```

Isso remove a entrada antiga do gerenciador de permissões, mantendo apenas `vendas_catalogo_minimalista` (`/vendas/catalogo`).

Se a rota antiga ainda estiver em uso no código, será necessário verificar e redirecionar para a nova.

### Arquivo alterado
- Migration SQL (1 arquivo)

