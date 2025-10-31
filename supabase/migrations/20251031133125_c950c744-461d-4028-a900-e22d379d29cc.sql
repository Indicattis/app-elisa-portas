-- Adicionar colunas para controle de conclusão de linhas
ALTER TABLE linhas_ordens 
ADD COLUMN IF NOT EXISTS concluida BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS concluida_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS concluida_por UUID REFERENCES admin_users(user_id);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_linhas_ordens_pedido_tipo ON linhas_ordens(pedido_id, tipo_ordem);
CREATE INDEX IF NOT EXISTS idx_linhas_ordens_concluida ON linhas_ordens(concluida);

-- Função para gerar número de ordem automaticamente
CREATE OR REPLACE FUNCTION gerar_numero_ordem(tipo_ordem TEXT)
RETURNS TEXT AS $$
DECLARE
  proximo_numero INTEGER;
  prefixo TEXT;
  tabela_nome TEXT;
  ano_atual TEXT;
BEGIN
  -- Define prefixo e tabela baseado no tipo
  CASE tipo_ordem
    WHEN 'soldagem' THEN 
      prefixo := 'OS';
      tabela_nome := 'ordens_soldagem';
    WHEN 'perfiladeira' THEN 
      prefixo := 'OP';
      tabela_nome := 'ordens_perfiladeira';
    WHEN 'separacao' THEN 
      prefixo := 'OE';
      tabela_nome := 'ordens_separacao';
    WHEN 'pintura' THEN 
      prefixo := 'OT';
      tabela_nome := 'ordens_pintura';
    WHEN 'instalacao' THEN 
      prefixo := 'OI';
      tabela_nome := 'ordens_instalacao';
    ELSE 
      prefixo := 'OR';
      tabela_nome := 'ordens_soldagem';
  END CASE;
  
  ano_atual := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Busca próximo número do ano atual para este tipo
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM ''^%s-%s-([0-9]+)$'') AS INTEGER)), 0) + 1 FROM %I WHERE numero_ordem LIKE ''%s-%s-%%''',
    prefixo, ano_atual, tabela_nome, prefixo, ano_atual
  ) INTO proximo_numero;
  
  RETURN prefixo || '-' || ano_atual || '-' || LPAD(proximo_numero::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se todas as ordens de um pedido estão concluídas
CREATE OR REPLACE FUNCTION verificar_ordens_pedido_concluidas(p_pedido_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_ordens INTEGER;
  ordens_concluidas INTEGER;
BEGIN
  -- Conta total de ordens do pedido
  SELECT 
    (SELECT COUNT(*) FROM ordens_soldagem WHERE pedido_id = p_pedido_id) +
    (SELECT COUNT(*) FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id) +
    (SELECT COUNT(*) FROM ordens_separacao WHERE pedido_id = p_pedido_id)
  INTO total_ordens;
  
  -- Conta ordens concluídas
  SELECT 
    (SELECT COUNT(*) FROM ordens_soldagem WHERE pedido_id = p_pedido_id AND status = 'concluido') +
    (SELECT COUNT(*) FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id AND status = 'concluido') +
    (SELECT COUNT(*) FROM ordens_separacao WHERE pedido_id = p_pedido_id AND status = 'concluido')
  INTO ordens_concluidas;
  
  -- Retorna true se todas estão concluídas e existe pelo menos uma ordem
  RETURN total_ordens > 0 AND total_ordens = ordens_concluidas;
END;
$$ LANGUAGE plpgsql;