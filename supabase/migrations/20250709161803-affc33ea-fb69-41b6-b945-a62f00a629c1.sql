-- Criar enum para os novos status
CREATE TYPE public.lead_status AS ENUM (
  'aguardando_atendimento',    -- 1
  'em_andamento',              -- 2
  'perdido',                   -- 3
  'aguardando_aprovacao_venda', -- 4
  'venda_reprovada',           -- 5
  'venda_aprovada'             -- 6
);

-- Criar enum para motivos de perda
CREATE TYPE public.motivo_perda AS ENUM (
  'desqualificado',
  'perdido_por_preco',
  'perdido_por_prazo',
  'outro'
);

-- Adicionar colunas para o novo sistema
ALTER TABLE public.elisaportas_leads 
ADD COLUMN novo_status public.lead_status DEFAULT 'aguardando_atendimento',
ADD COLUMN tag_id INTEGER DEFAULT NULL,
ADD COLUMN motivo_perda public.motivo_perda DEFAULT NULL,
ADD COLUMN observacoes_perda TEXT DEFAULT NULL;

-- Migrar dados existentes baseado no status_atendimento atual
UPDATE public.elisaportas_leads 
SET novo_status = CASE 
  WHEN status_atendimento = 1 THEN 'aguardando_atendimento'::public.lead_status
  WHEN status_atendimento = 2 THEN 'em_andamento'::public.lead_status
  WHEN status_atendimento = 3 THEN 'em_andamento'::public.lead_status  -- pausado vira em andamento
  WHEN status_atendimento = 4 THEN 'aguardando_aprovacao_venda'::public.lead_status
  WHEN status_atendimento = 5 THEN 'venda_aprovada'::public.lead_status
  WHEN status_atendimento = 6 THEN 'perdido'::public.lead_status  -- desqualificado vira perdido
  ELSE 'aguardando_atendimento'::public.lead_status
END;

-- Criar índices para performance
CREATE INDEX idx_elisaportas_leads_novo_status ON public.elisaportas_leads(novo_status);
CREATE INDEX idx_elisaportas_leads_tag_id ON public.elisaportas_leads(tag_id);

-- Função para automatizar mudanças de tag baseadas no status
CREATE OR REPLACE FUNCTION public.update_lead_tag_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando o status muda para perdido, tag vira 8 (Perdido)
  IF NEW.novo_status = 'perdido' THEN
    NEW.tag_id = 8;
  -- Quando o status muda para aguardando aprovação, tag vira 9 (Aguardando gerência)
  ELSIF NEW.novo_status = 'aguardando_aprovacao_venda' THEN
    NEW.tag_id = 9;
  -- Quando o status muda para venda reprovada, tag vira 8 (Perdido)
  ELSIF NEW.novo_status = 'venda_reprovada' THEN
    NEW.tag_id = 8;
  -- Quando o status muda para venda aprovada, tag vira 7 (Cliente fechado)
  ELSIF NEW.novo_status = 'venda_aprovada' THEN
    NEW.tag_id = 7;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para automatizar mudanças de tag
CREATE TRIGGER trigger_update_lead_tag_on_status_change
  BEFORE UPDATE ON public.elisaportas_leads
  FOR EACH ROW
  WHEN (OLD.novo_status IS DISTINCT FROM NEW.novo_status)
  EXECUTE FUNCTION public.update_lead_tag_on_status_change();