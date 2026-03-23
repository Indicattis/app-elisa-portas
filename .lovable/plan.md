

## Plano: Adicionar filtro de canal de aquisição na página LTV

### O que será feito

Adicionar um select/dropdown ao lado da barra de busca para filtrar clientes por canal de aquisição. Os cards de resumo também serão recalculados com base no filtro selecionado.

### Alterações em `src/pages/marketing/LtvMinimalista.tsx`

1. **Novo state**: `canalFiltro` (string, default `'todos'`)

2. **Extrair lista de canais únicos** dos dados carregados via `useMemo` a partir de `clientesLtv`

3. **Adicionar select dropdown** ao lado do input de busca, com estilo glassmorphism consistente (bg-white/5, border-white/10, backdrop-blur), opção "Todos os canais" + canais dinâmicos

4. **Filtrar no `filtered` useMemo**: além da busca por nome, aplicar filtro por canal quando `canalFiltro !== 'todos'`

5. **Recalcular resumo** com base na lista filtrada (não na lista completa) para que os cards reflitam o canal selecionado

### Estilo visual

O dropdown seguirá o mesmo padrão da barra de busca: `select` nativo estilizado com classes `bg-white/5 border border-white/10 text-white text-sm rounded-lg`, dentro do mesmo container glassmorphism.

