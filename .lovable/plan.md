

# Reformular /direcao/dre/custos com nova tabela de produtos

## Resumo

Substituir a tabela de estoque por uma nova tabela `dre_custos_produtos` com campos editáveis para PRODUTO, CUSTO e LUCRO. As colunas IMPOSTOS (10%), COMISSÃO (8%), CARTÃO (4%) e PREÇO SUGERIDO serão calculadas automaticamente a partir de CUSTO + LUCRO.

## Lógica de cálculo

- **Base** = CUSTO + LUCRO
- **IMPOSTOS** = Base × 10%
- **COMISSÃO** = Base × 8%
- **CARTÃO** = Base × 4%
- **PREÇO SUGERIDO** = Base + IMPOSTOS + COMISSÃO + CARTÃO (= Base × 1.22)

## 1. Migração SQL — Nova tabela `dre_custos_produtos`

```sql
CREATE TABLE public.dre_custos_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto TEXT NOT NULL,
  custo NUMERIC DEFAULT 0,
  lucro NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.dre_custos_produtos ENABLE ROW LEVEL SECURITY;
-- Policies para authenticated read/insert/update/delete
```

## 2. Reescrever `DRECustosDirecao.tsx`

- Buscar dados de `dre_custos_produtos` em vez de `estoque`
- Colunas: Nº, PRODUTO, CUSTO, LUCRO, IMPOSTOS 10%, COMISSÃO 8%, CARTÃO 4%, PREÇO SUGERIDO
- CUSTO e LUCRO: editáveis inline (click-to-edit)
- IMPOSTOS, COMISSÃO, CARTÃO, PREÇO SUGERIDO: calculados no frontend (read-only)
- Botão para adicionar novo produto (input inline ou modal simples)
- Botão para excluir produto
- Busca por nome de produto
- Título/subtítulo atualizados

## Arquivos afetados
- Migração SQL (nova tabela)
- `src/pages/direcao/DRECustosDirecao.tsx` (reescrita completa)

