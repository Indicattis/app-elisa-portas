

## Plano: Tooltip na linha inteira com preços padrões P/G/GG

### Situação atual
- O tooltip só aparece ao fazer hover na célula "Portas"
- Exibe os valores acordados por porta do acordo

### O que mudar

**Arquivo: `src/pages/logistica/AcordosAutorizados.tsx`**

1. **Buscar preços padrões**: Adicionar query ao `autorizado_precos_portas` para obter os preços de referência (P, G, GG) de cada autorizado envolvido nos acordos.

2. **Mover tooltip para a linha inteira**: Envolver o `<TableRow>` com `<Tooltip>`, usando o `<TooltipTrigger>` na row toda. Assim, o hover em qualquer célula aciona o tooltip.

3. **Conteúdo do tooltip**: Exibir os preços padrões do autorizado vinculado ao acordo:
   - Porta P: R$ X
   - Porta G: R$ X
   - Porta GG: R$ X

4. **Remover tooltip antigo** da célula de Portas (substitui pelo tooltip da row).

### Detalhes técnicos
- Importar `useEffect`/`useState` e `supabase` para buscar `autorizado_precos_portas` dos `autorizado_id`s presentes nos acordos
- Criar um `Map<autorizado_id, {P, G, GG}>` com os preços padrões
- O `TooltipTrigger` envolverá o conteúdo da row (usando `asChild` num wrapper `<tr>`)

### Arquivo impactado
- `src/pages/logistica/AcordosAutorizados.tsx`

