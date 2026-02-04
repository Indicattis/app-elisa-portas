

# Plano: Corrigir Função get_desempenho_etapas - Erro na Coluna tamanho_porta

## Problema Identificado

A função `get_desempenho_etapas` está falhando com erro:
```
column os.tamanho_porta does not exist
```

### Estrutura Real da Tabela ordens_soldagem:
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| qtd_portas_p | integer | Quantidade de portas tamanho P |
| qtd_portas_g | integer | Quantidade de portas tamanho G |

### Código Errado na Função:
```sql
-- Portas P soldadas (ERRADO)
SELECT COUNT(*)
FROM ordens_soldagem os
WHERE os.tamanho_porta = 'P'  -- Coluna não existe!
```

### Ordens de Pintura Concluídas (dados existentes):
- 02/02/2026: 3 ordens
- 30/01/2026: 4 ordens
- 28/01/2026: 2 ordens

Ou seja, os dados estão corretos no banco, mas a função SQL está com erro de sintaxe.

## Solução

Corrigir a função SQL para usar as colunas corretas:

```sql
-- Portas P soldadas - CORRIGIDO
COALESCE((
  SELECT SUM(os.qtd_portas_p)
  FROM ordens_soldagem os
  WHERE os.responsavel_id = au.user_id
    AND os.status = 'concluido'
    AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
), 0)::bigint AS soldadas_p,

-- Portas G soldadas - CORRIGIDO
COALESCE((
  SELECT SUM(os.qtd_portas_g)
  FROM ordens_soldagem os
  WHERE os.responsavel_id = au.user_id
    AND os.status = 'concluido'
    AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
), 0)::bigint AS soldadas_g,
```

## Migração SQL Completa

```sql
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
    
    -- Metros perfilados por colaborador
    COALESCE((
      SELECT SUM(lo.quantidade * REPLACE(lo.tamanho, ',', '.')::numeric)
      FROM linhas_ordens lo
      JOIN ordens_perfiladeira op ON op.id = lo.ordem_id
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.concluida_por = au.user_id
        AND lo.tamanho IS NOT NULL
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS perfiladas_metros,
    
    -- Portas soldadas total por colaborador
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas,
    
    -- Portas P soldadas - CORRIGIDO: usar SUM(qtd_portas_p)
    COALESCE((
      SELECT SUM(os.qtd_portas_p)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas_p,
    
    -- Portas G soldadas - CORRIGIDO: usar SUM(qtd_portas_g)
    COALESCE((
      SELECT SUM(os.qtd_portas_g)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas_g,
    
    -- Pedidos separados por colaborador
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_separacao osep
      WHERE osep.responsavel_id = au.user_id
        AND osep.status = 'concluido'
        AND osep.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS separadas,
    
    -- Pintura m² (já corrigido para usar 'pronta')
    COALESCE((
      SELECT SUM(pl.largura * pl.altura / 1000000.0)
      FROM ordens_pintura op
      JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
      WHERE op.responsavel_id = au.user_id
        AND op.status = 'pronta'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pl.largura IS NOT NULL
        AND pl.altura IS NOT NULL
    ), 0)::numeric AS pintura_m2,
    
    -- Carregamentos por colaborador
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido_por = au.user_id
        AND i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos
    
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true;
END;
$$;
```

## Resultado Esperado

Após a correção:
- A função não retornará mais erro 400
- O ranking de pintura mostrará os m² das 13 ordens concluídas
- O ranking de soldagem mostrará corretamente a contagem de portas P e G por colaborador
