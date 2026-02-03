
# Plano: Calcular Metragem Linear ao Concluir Ordem de Perfiladeira

## Problema Identificado

A função `concluirOrdem` em `useOrdemProducao.ts` não calcula o campo `metragem_linear` antes de concluir ordens de perfiladeira.

### Dados da Ordem OPE-2026-0038:
| Campo | Valor |
|-------|-------|
| metragem_linear | 0 (deveria ser ~1725m) |
| Linhas | 17 linhas com tamanho preenchido |
| Meta do colaborador | 10.000 metros |
| Progresso atual | 0 metros |

## Solucao

### 1. Modificar `src/hooks/useOrdemProducao.ts`

Na funcao `concluirOrdem`, antes de atualizar a ordem, calcular a metragem das linhas para ordens de perfiladeira:

```typescript
// Na função concluirOrdem, após marcar linhas como concluídas (linha 529):

// Para ordens de perfiladeira, calcular metragem_linear das linhas
if (tipoOrdem === 'perfiladeira') {
  const { data: linhas } = await supabase
    .from('linhas_ordens')
    .select('quantidade, tamanho')
    .eq('ordem_id', ordemId)
    .eq('tipo_ordem', 'perfiladeira');
  
  if (linhas) {
    const metragemTotal = linhas.reduce((acc, linha) => {
      const metros = parseFloat(String(linha.tamanho || '0').replace(',', '.')) || 0;
      const quantidade = linha.quantidade || 1;
      return acc + (metros * quantidade);
    }, 0);
    
    updateData.metragem_linear = metragemTotal;
  }
}
```

### 2. Correcao Imediata da Ordem OPE-2026-0038

Executar uma query para calcular e atualizar a metragem da ordem que ja foi concluida:

```sql
-- Calcular metragem das linhas da ordem
WITH metragem AS (
  SELECT 
    SUM(
      (CAST(REPLACE(COALESCE(tamanho, '0'), ',', '.') AS NUMERIC)) 
      * COALESCE(quantidade, 1)
    ) as total
  FROM linhas_ordens 
  WHERE ordem_id = '95f9bcf5-b030-4b00-aea2-e64c2447e209'
)
UPDATE ordens_perfiladeira 
SET metragem_linear = (SELECT total FROM metragem)
WHERE id = '95f9bcf5-b030-4b00-aea2-e64c2447e209';
```

## Fluxo Corrigido

1. Operador conclui ordem de perfiladeira
2. Sistema busca todas as linhas da ordem
3. **NOVO:** Sistema calcula metragem total (tamanho x quantidade para cada linha)
4. **NOVO:** Sistema salva `metragem_linear` na ordem
5. Meta do colaborador contabiliza corretamente o progresso

## Resultado Esperado

- Ordem OPE-2026-0038 tera ~1725 metros registrados
- Meta do Joao Vitor mostrara progresso de ~1725/10000 metros (17,25%)
- Futuras ordens de perfiladeira terao metragem calculada automaticamente
