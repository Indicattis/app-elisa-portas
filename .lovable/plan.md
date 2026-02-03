

# Plano: Adicionar Rotas de Conferencia ao Gerenciamento de Permissoes

## Problema

As rotas de conferencia de estoque e almoxarifado existem no codigo da aplicacao, mas nao estao registradas na tabela `app_routes`. Por isso, nao aparecem na interface de gerenciamento de permissoes quando a interface "Producao" esta selecionada.

## Rotas a Adicionar

| Rota | Path | Label |
|------|------|-------|
| producao_conferencia_estoque | /producao/conferencia-estoque | Conferencia - Estoque da Fabrica |
| producao_conferencia_almox | /producao/conferencia-almox | Conferencia - Almoxarifado |

## Solucao

Executar uma query SQL para inserir as rotas de conferencia na tabela `app_routes` com `interface='producao'`.

```sql
INSERT INTO app_routes (key, path, label, description, interface, active, sort_order)
VALUES 
  ('producao_conferencia_estoque', '/producao/conferencia-estoque', 'Conferência - Estoque', 'Conferência de estoque da fábrica', 'producao', true, 10),
  ('producao_conferencia_almox', '/producao/conferencia-almox', 'Conferência - Almoxarifado', 'Conferência de produtos do almoxarifado', 'producao', true, 11);
```

## Passos de Implementacao

1. **Executar a query SQL** no banco de dados para adicionar as rotas
2. As rotas aparecerao automaticamente na interface de permissoes ao selecionar "Producao"
3. Nenhuma alteracao de codigo e necessaria - o componente `UserRouteAccessManager` ja busca todas as rotas com `interface='producao'`

## Resultado Esperado

Ao selecionar a interface "Producao" em `/admin/permissions`:
- Aparecerao as rotas existentes (Solda, Perfiladeira, Separacao, etc.)
- **Novas:** Conferencia - Estoque e Conferencia - Almoxarifado
- O administrador podera conceder/revogar acesso a essas rotas por usuario

## Observacao

Apos inserir as rotas no banco, pode ser necessario verificar se os componentes de producao que renderizam os links de conferencia (como `ProducaoHome.tsx`) respeitam as permissoes. Atualmente, os cards de conferencia sao exibidos fixamente - se desejar, posso tambem adicionar verificacao de permissao nesses links.

