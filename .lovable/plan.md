

## Plano: Exibir todos os leads e adicionar paginação

### Problema
A query atual filtra por `.eq('atendente_id', user!.id)`, mostrando apenas leads atribuídos ao usuário logado. Além disso, o Supabase tem limite padrão de 1000 registros por query.

### Alterações em `src/pages/vendas/LeadsList.tsx`

1. **Remover filtro por atendente** — trocar `.eq('atendente_id', user!.id)` para buscar todos os leads (ou condicionar ao papel do usuário: admin/gerente vê todos, atendente vê apenas os seus)
2. **Adicionar paginação** com range do Supabase:
   - Estado `pagina` (número da página atual) e `totalLeads`
   - Usar `.range(from, to)` na query com páginas de 50 registros
   - Usar o componente `Pagination` existente no projeto para navegação entre páginas
3. **Lógica de visibilidade por papel**:
   - Se `isAdmin || isGerenteComercial || hasBypassPermissions` → buscar todos
   - Se `isAtendente` → manter filtro `.eq('atendente_id', user!.id)`

### Resultado
Todos os leads aparecerão com navegação paginada, respeitando o papel do usuário logado.

