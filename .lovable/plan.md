

## Plano: Todos veem todos os leads + mostrar responsável

### Alterações em `src/pages/vendas/LeadsList.tsx`

1. **Remover filtro por papel** — todos os usuários verão todos os leads (remover o bloco `if (!isAdmin && ...)`)

2. **Buscar nome do atendente** — a tabela `elisaportas_leads` tem `atendente_id` (referência a `admin_users`). Após buscar os leads, fazer uma query separada em `admin_users` para mapear `id → nome` dos atendentes presentes nos resultados. Alternativa: usar select com join se possível.

3. **Exibir responsável no card** — adicionar o nome do atendente em cada card com ícone `User`, estilo `text-white/50` consistente com os outros metadados.

4. **Interface Lead** — adicionar `atendente_id: string | null` ao tipo.

5. **Manter paginação** — a paginação de 50 por página já existe e continuará funcionando.

### Arquivos alterados
- `src/pages/vendas/LeadsList.tsx`

