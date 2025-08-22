-- Adicionar campos para armazenar dados completos do orçamento no pedido
ALTER TABLE pedidos_producao 
ADD COLUMN orcamento_id uuid,
ADD COLUMN cliente_email text,
ADD COLUMN cliente_cpf text,
ADD COLUMN cliente_bairro text,
ADD COLUMN forma_pagamento text,
ADD COLUMN valor_venda numeric,
ADD COLUMN valor_entrada numeric,
ADD COLUMN numero_parcelas integer,
ADD COLUMN observacoes_venda text,
ADD COLUMN produtos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN valor_frete numeric DEFAULT 0,
ADD COLUMN valor_instalacao numeric DEFAULT 0,
ADD COLUMN modalidade_instalacao text;

-- Criar tabela para controle de numeração sequencial
CREATE TABLE IF NOT EXISTS numeracao_controle (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL UNIQUE, -- 'pedido' ou 'orcamento'
  proximo_numero integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Inserir controles iniciais
INSERT INTO numeracao_controle (tipo, proximo_numero) 
VALUES 
  ('pedido', 1),
  ('orcamento', 1)
ON CONFLICT (tipo) DO NOTHING;

-- Função para gerar próximo número
CREATE OR REPLACE FUNCTION gerar_proximo_numero(tipo_documento text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  proximo_num integer;
BEGIN
  UPDATE numeracao_controle 
  SET proximo_numero = proximo_numero + 1,
      updated_at = now()
  WHERE tipo = tipo_documento
  RETURNING proximo_numero - 1 INTO proximo_num;
  
  RETURN proximo_num;
END;
$$;

-- RLS para numeracao_controle
ALTER TABLE numeracao_controle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver numeração"
ON numeracao_controle FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem atualizar numeração"
ON numeracao_controle FOR UPDATE
USING (is_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_numeracao_controle_updated_at
BEFORE UPDATE ON numeracao_controle
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();