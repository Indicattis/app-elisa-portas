

## Plano: Filtrar lista de Ajuste de Pontuação

### Problema
A lista mostra 71 itens incluindo pedidos que ainda não estão na etapa `finalizado` (possivelmente pelo filtro não funcionar como esperado no Supabase) e instalações feitas por autorizados (`tipo_instalacao = 'autorizados'`), que não devem aparecer pois não contam para o ranking de equipes internas.

### Solução
Alterar a query em `src/hooks/useAjustePontuacaoInstalacao.ts`:

1. **Excluir autorizados**: adicionar filtro `.or('tipo_instalacao.is.null,tipo_instalacao.eq.elisa')` — só mostrar instalações sem tipo definido ou do tipo `elisa` (equipe interna)
2. **Reforçar filtro de etapa**: adicionar também um filtro `!= 'arquivado'` e garantir que apenas `finalizado` passe. Se o filtro `!inner` do Supabase não estiver funcionando corretamente com nested joins, fazer filtragem client-side adicional removendo itens cuja `etapa_atual !== 'finalizado'`

### Detalhes técnicos

**`src/hooks/useAjustePontuacaoInstalacao.ts`**
- Na query (linha 28-49): adicionar `tipo_instalacao` ao select e adicionar filtro `.or('tipo_instalacao.is.null,tipo_instalacao.eq.elisa')`
- No mapeamento dos resultados (linha 53-58): adicionar filtro client-side para garantir `etapa_atual === 'finalizado'`

### Arquivo alterado
- `src/hooks/useAjustePontuacaoInstalacao.ts`

