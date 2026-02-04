
# Plano: Corrigir Calculo de Metro Quadrado no Ranking de Pintura

## Problema Identificado

As funcoes SQL que calculam o ranking de pintura em `/direcao/gestao-fabrica` estao filtrando por `status = 'concluido'`, mas as ordens de pintura sao finalizadas com `status = 'pronta'`.

### Evidencia:
| Status | Quantidade | Ultima Conclusao |
|--------|------------|------------------|
| pronta | 13 ordens  | 2026-02-03 |
| concluido | 0 ordens | - |

### Codigo Problematico (useOrdemPintura.ts linha 296):
```typescript
.update({ 
  status: 'pronta',  // <-- Pintura usa 'pronta', nao 'concluido'
  data_conclusao: new Date().toISOString(),
  ...
})
```

### Funcoes SQL Afetadas:
1. `get_portas_por_etapa` - Calcula metragem total de pintura
2. `get_desempenho_etapas` - Calcula ranking por colaborador

Ambas filtram: `WHERE op.status = 'concluido'` (incorreto)

## Solucao

Atualizar as duas funcoes SQL para usar `status = 'pronta'` ao filtrar ordens de pintura concluidas.

### Migracao SQL:

```sql
-- Corrigir get_portas_por_etapa: usar status 'pronta' para pintura
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa(p_data_inicio date, p_data_fim date)
RETURNS TABLE(
  metros_perfilados numeric,
  portas_soldadas bigint,
  pedidos_separados bigint,
  pintura_m2 numeric,
  carregamentos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Metros perfilados (sem alteracao)
    COALESCE((
      SELECT SUM(lo.quantidade * REPLACE(lo.tamanho, ',', '.')::numeric)
      FROM linhas_ordens lo
      JOIN ordens_perfiladeira op ON op.id = lo.ordem_id
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.tamanho IS NOT NULL
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS metros_perfilados,
    
    -- Portas soldadas (sem alteracao)
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      WHERE os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS portas_soldadas,
    
    -- Pedidos separados (sem alteracao)
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_separacao osep
      WHERE osep.status = 'concluido'
        AND osep.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS pedidos_separados,
    
    -- Pintura m² - CORRECAO: usar 'pronta' em vez de 'concluido'
    COALESCE((
      SELECT SUM(pl.largura * pl.altura / 1000000.0)
      FROM ordens_pintura op
      JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
      WHERE op.status = 'pronta'  -- CORRIGIDO
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pl.largura IS NOT NULL
        AND pl.altura IS NOT NULL
    ), 0)::numeric AS pintura_m2,
    
    -- Carregamentos (sem alteracao)
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos;
END;
$$;

-- Corrigir get_desempenho_etapas: usar status 'pronta' para pintura
DROP FUNCTION IF EXISTS public.get_desempenho_etapas(date, date);

CREATE OR REPLACE FUNCTION public.get_desempenho_etapas(p_data_inicio date, p_data_fim date)
RETURNS TABLE(
  user_id uuid,
  nome text,
  foto_perfil_url text,
  perfiladas_metros numeric,
  soldadas bigint,
  soldadas_p bigint,
  soldadas_g bigint,
  separadas bigint,
  pintura_m2 numeric,
  carregamentos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.user_id,
    au.nome,
    au.foto_perfil_url,
    
    -- Metros perfilados (sem alteracao)
    ...
    
    -- Pintura m² - CORRECAO: usar 'pronta' em vez de 'concluido'
    COALESCE((
      SELECT SUM(pl.largura * pl.altura / 1000000.0)
      FROM ordens_pintura op
      JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
      WHERE op.responsavel_id = au.user_id
        AND op.status = 'pronta'  -- CORRIGIDO
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pl.largura IS NOT NULL
        AND pl.altura IS NOT NULL
    ), 0)::numeric AS pintura_m2,
    
    ...
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true;
END;
$$;
```

## Arquivos a Modificar

| Tipo | Arquivo | Alteracao |
|------|---------|-----------|
| SQL Migration | Novo arquivo | Atualizar as 2 funcoes RPC |

## Impacto

- **Imediato**: As 13 ordens de pintura concluidas serao contabilizadas
- **Ranking**: Colaboradores que pintaram verao seus m² corretamente
- **Dashboard**: A metragem total de pintura aparecera em `/direcao/gestao-fabrica`

## Nenhuma alteracao de codigo frontend

O codigo TypeScript ja espera o campo `pintura_m2` - apenas o SQL estava filtrando incorretamente.
