

## Plano: Corrigir divergência entre totais e ranking de colaboradores

### Problema

Os valores totais do "Desempenho por Etapa" e os valores do ranking de colaboradores vêm de **fontes de dados diferentes**:

- **Totais (cabeçalho)**: RPC `get_portas_por_etapa` → consulta tabelas de produção reais (`ordens_soldagem`, `ordens_perfiladeira`, `ordens_separacao`, `ordens_pintura`, `instalacoes`)
- **Ranking (colaboradores)**: hook `useDesempenhoEtapas` → consulta tabela `pontuacao_colaboradores` + `ordens_carregamento` + `instalacoes`

Como as tabelas são diferentes, os números não batem.

### Solução

Eliminar o uso da RPC `get_portas_por_etapa` no componente `PortasPorEtapa.tsx` e calcular os totais como a **soma dos valores dos colaboradores** retornados por `useDesempenhoEtapas`. Isso garante que o total sempre seja igual à soma do ranking.

### Mudanças

**1. `src/components/producao/dashboard/PortasPorEtapa.tsx`**
- Remover import e uso de `usePortasPorEtapa`
- Criar um `useMemo` que soma os campos de todos os colaboradores do `useDesempenhoEtapas`:
  - `metros_perfilados` = soma de `perfiladas_metros`
  - `portas_soldadas` = soma de `soldadas`
  - `pedidos_separados` = soma de `separadas`
  - `pintura_m2` = soma de `pintura_m2`
  - `carregamentos` = soma de `carregamentos`
- Usar esses totais calculados no lugar de `data?.metros_perfilados`, etc.
- Remover a variável `isLoading` do RPC, usar apenas `isLoadingDesempenho`

Nenhum outro arquivo precisa ser alterado. A mudança é isolada ao componente de exibição.

