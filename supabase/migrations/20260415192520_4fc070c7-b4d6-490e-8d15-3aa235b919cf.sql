-- 1. Atualizar constraint para aceitar 'instalacao'
ALTER TABLE produtos_vendas DROP CONSTRAINT check_tipo_produto;
ALTER TABLE produtos_vendas ADD CONSTRAINT check_tipo_produto 
  CHECK (tipo_produto = ANY (ARRAY['porta_enrolar','porta_social','pintura_epoxi','acessorio','adicional','porta','manutencao','instalacao']));

-- 2. Migrar dados: separar instalação como produto independente para vendas não faturadas
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT pv.*
    FROM produtos_vendas pv
    WHERE pv.faturamento IS NOT TRUE
      AND pv.valor_instalacao > 0
      AND pv.tipo_produto IN ('porta_enrolar', 'porta_social', 'porta')
  LOOP
    INSERT INTO produtos_vendas (
      venda_id, tipo_produto, descricao, tamanho, largura, altura,
      valor_produto, valor_pintura, valor_instalacao, valor_frete,
      tipo_desconto, desconto_percentual, desconto_valor,
      quantidade, cor_id, faturamento, valor_total,
      created_at
    ) VALUES (
      r.venda_id,
      'instalacao',
      'Instalação - ' || CASE 
        WHEN r.tipo_produto = 'porta_social' THEN 'Porta Social'
        ELSE 'Porta de Enrolar'
      END || COALESCE(' ' || r.largura || 'x' || r.altura || 'm', ''),
      r.tamanho,
      r.largura,
      r.altura,
      r.valor_instalacao,
      0, 0, 0,
      'percentual', 0, 0,
      r.quantidade,
      NULL,
      false,
      r.valor_instalacao * r.quantidade,
      now()
    );

    UPDATE produtos_vendas
    SET valor_instalacao = 0,
        valor_total = GREATEST(0, valor_total - (r.valor_instalacao * r.quantidade))
    WHERE id = r.id;
  END LOOP;
END $$;