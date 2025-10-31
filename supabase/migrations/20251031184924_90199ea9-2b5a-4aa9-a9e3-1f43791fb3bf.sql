-- Criar tabela ordens_qualidade
CREATE TABLE ordens_qualidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos_producao(id) ON DELETE CASCADE,
  numero_ordem text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pendente',
  responsavel_id uuid REFERENCES admin_users(user_id),
  data_inicio timestamp with time zone,
  data_conclusao timestamp with time zone,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES admin_users(user_id)
);

-- Índices para performance
CREATE INDEX idx_ordens_qualidade_pedido_id ON ordens_qualidade(pedido_id);
CREATE INDEX idx_ordens_qualidade_status ON ordens_qualidade(status);

-- RLS Policies
ALTER TABLE ordens_qualidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ordens_qualidade"
  ON ordens_qualidade FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert ordens_qualidade"
  ON ordens_qualidade FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ordens_qualidade"
  ON ordens_qualidade FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_ordens_qualidade_updated_at
  BEFORE UPDATE ON ordens_qualidade
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar ordens_qualidade ao realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ordens_qualidade;

-- Atualizar função gerar_numero_ordem para suportar qualidade
CREATE OR REPLACE FUNCTION public.gerar_numero_ordem(tipo_ordem text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
    WHEN 'qualidade' THEN 
      prefixo := 'OQ';
      tabela_nome := 'ordens_qualidade';
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
$function$;

-- Criar função para criar ordem de qualidade
CREATE OR REPLACE FUNCTION criar_ordem_qualidade(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_numero_ordem TEXT;
  v_ordem_id uuid;
  v_linha RECORD;
BEGIN
  -- Gerar número da ordem
  SELECT gerar_numero_ordem('qualidade') INTO v_numero_ordem;
  
  -- Criar ordem de qualidade
  INSERT INTO ordens_qualidade (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;
  
  -- Criar linhas baseadas nas linhas do pedido
  FOR v_linha IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'qualidade',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
    );
  END LOOP;
END;
$$;

-- Inserir item na sidebar (Qualidade dentro de Produção)
INSERT INTO app_tabs (
  key,
  label,
  href,
  icon,
  parent_key,
  sort_order,
  active,
  tab_group,
  permission
) VALUES (
  'qualidade',
  'Qualidade',
  '/dashboard/producao/qualidade',
  'ClipboardCheck',
  'producao_group',
  4,
  true,
  'sidebar',
  'producao'
) ON CONFLICT (key) DO NOTHING;