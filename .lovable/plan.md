

## Diagnóstico: Pintura mostrando 0m² e classificação de solda incorreta

### Problema encontrado

A função SQL `registrar_pontuacao_ordem` divide `largura` e `altura` por 1000, assumindo que estão em **milímetros**. Porém, os valores em `produtos_vendas` já estão em **metros** (ex: largura=4.76, altura=5.50).

Resultado:
- **Pintura**: `4.76/1000 × 5.50/1000 = 0.00002618 m²` em vez de `26.18 m²` → aparece como "0,0m²"
- **Solda**: todas as portas classificadas como "P" pois a área calculada nunca atinge os thresholds de 25/50

### Solução

Alterar a função `registrar_pontuacao_ordem` para usar `largura * altura` diretamente (sem dividir por 1000), em **dois pontos**:

1. **Pintura** (cálculo do m² total): `SUM(pv.largura * pv.altura * COALESCE(pv.quantidade, 1))`
2. **Soldagem** (classificação P/G/GG): `pv.largura * pv.altura` nos thresholds

Também será necessário **corrigir os dados existentes** na `pontuacao_colaboradores` — multiplicar `metragem_quadrada_pintada` por `1000000` (1000×1000) para restaurar os valores corretos.

### Arquivo alterado
- Migration SQL (via ferramenta de migração do Supabase)

### SQL da migração

```sql
-- 1. Corrigir a função removendo /1000.0
CREATE OR REPLACE FUNCTION registrar_pontuacao_ordem()
  -- Mesmo corpo, mas com:
  -- Soldagem: (pv.largura * pv.altura) em vez de (pv.largura/1000.0 * pv.altura/1000.0)
  -- Pintura: SUM(pv.largura * pv.altura * ...) em vez de SUM((pv.largura/1000.0) * (pv.altura/1000.0) * ...)

-- 2. Corrigir dados históricos
UPDATE pontuacao_colaboradores
SET metragem_quadrada_pintada = metragem_quadrada_pintada * 1000000
WHERE tipo_ranking = 'pintura'
  AND metragem_quadrada_pintada IS NOT NULL
  AND metragem_quadrada_pintada > 0;
```

