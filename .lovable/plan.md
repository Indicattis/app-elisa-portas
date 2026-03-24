

## Plano: Grid de meses para acordos em /direcao/autorizados

### Objetivo
Substituir a listagem direta de acordos por um grid de 3 colunas com os 12 meses do ano. Ao clicar em um mês, abre-se um dialog/sheet mostrando os acordos daquele mês.

### Alterações em `src/pages/direcao/AutorizadosPrecosDirecao.tsx`

1. **Adicionar seletor de ano** — um controle simples (botões < ano >) acima do grid de meses

2. **Substituir a tabela de acordos pelo grid de meses** — grid 3 colunas (Jan-Dez), cada card mostra:
   - Nome do mês
   - Quantidade de acordos no mês
   - Valor total dos acordos
   - Indicador visual de pendentes (badge com contagem)

3. **Agrupar acordos por mês** — usar `useMemo` para criar um map `mês → acordos[]` baseado no campo `data_acordo`

4. **Dialog/Sheet ao clicar no mês** — abre um `Dialog` com:
   - Título: nome do mês + ano
   - Filtros existentes (busca + status) dentro do dialog
   - A mesma tabela de acordos atual, mas filtrada pelo mês selecionado
   - Botões de aprovar/reprovar mantidos

### Arquivo alterado
- `src/pages/direcao/AutorizadosPrecosDirecao.tsx`

