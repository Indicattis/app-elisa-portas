

## Plano: Adicionar coluna "Tamanho Total" na tabela de itens pendentes

### O que será feito

Adicionar uma coluna **Tamanho Total** na tabela de itens pendentes por etapa, que soma os valores de `largura * altura * quantidade` (ou `tamanho * quantidade` quando aplicável) agrupados por item.

### Alterações

**1. `src/pages/administrativo/ProducaoAdminReadOnly.tsx`**

- No `useMemo` de `itensAgrupadosPorEtapa`, adicionar campo `tamanhoTotal` ao tipo do grupo, acumulando `(largura && altura ? largura * altura : 0) * quantidade` para cada item
- Na `TableHeader`, adicionar coluna "Tamanho Total" entre "Qtd Total" e "Pedidos"
- Na `TableBody`, exibir o valor formatado com 2 casas decimais e sufixo "m²"

**2. `src/hooks/useItensNaoConcluidosPorEtapa.ts`**

- Nenhuma alteração — `largura` e `altura` já são retornados pelo hook

### Detalhes técnicos

O cálculo será: para cada linha, somar `(largura * altura) * quantidade` ao `tamanhoTotal` do grupo. Itens sem largura/altura contribuem 0.

