-- Criar tabela de acessórios
CREATE TABLE public.acessorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de adicionais
CREATE TABLE public.adicionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de cliente na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN cliente_nome TEXT,
ADD COLUMN cliente_cpf TEXT,
ADD COLUMN cliente_telefone TEXT,
ADD COLUMN cliente_estado TEXT,
ADD COLUMN cliente_cidade TEXT,
ADD COLUMN cliente_bairro TEXT,
ADD COLUMN cliente_cep TEXT,
ADD COLUMN modalidade_instalacao TEXT DEFAULT 'instalacao_elisa',
ADD COLUMN autorizado_id UUID,
ADD COLUMN desconto_total_percentual NUMERIC DEFAULT 0;

-- Modificar tabela orcamento_produtos para incluir novos campos
ALTER TABLE public.orcamento_produtos
ADD COLUMN preco_producao NUMERIC DEFAULT 0,
ADD COLUMN preco_instalacao NUMERIC DEFAULT 0,
ADD COLUMN cor_id UUID,
ADD COLUMN acessorio_id UUID,
ADD COLUMN adicional_id UUID,
ADD COLUMN descricao_manutencao TEXT,
ADD COLUMN desconto_percentual NUMERIC DEFAULT 0;

-- Criar referências para cores, acessórios e adicionais
ALTER TABLE public.orcamento_produtos 
ADD CONSTRAINT fk_orcamento_produtos_cor 
FOREIGN KEY (cor_id) REFERENCES public.catalogo_cores(id);

ALTER TABLE public.orcamento_produtos 
ADD CONSTRAINT fk_orcamento_produtos_acessorio 
FOREIGN KEY (acessorio_id) REFERENCES public.acessorios(id);

ALTER TABLE public.orcamento_produtos 
ADD CONSTRAINT fk_orcamento_produtos_adicional 
FOREIGN KEY (adicional_id) REFERENCES public.adicionais(id);

ALTER TABLE public.orcamentos 
ADD CONSTRAINT fk_orcamentos_autorizado 
FOREIGN KEY (autorizado_id) REFERENCES public.autorizados(id);

-- Inserir alguns acessórios padrão
INSERT INTO public.acessorios (nome, preco, descricao) VALUES
('Fechadura com chave', 150.00, 'Fechadura padrão com chave'),
('Fechadura digital', 350.00, 'Fechadura biométrica'),
('Motor adicional', 800.00, 'Motor de backup'),
('Controle remoto extra', 80.00, 'Controle remoto adicional'),
('Sensor de presença', 200.00, 'Sensor para abertura automática');

-- Inserir alguns adicionais padrão
INSERT INTO public.adicionais (nome, preco, descricao) VALUES
('Instalação expressa', 300.00, 'Instalação em 24h'),
('Garantia estendida', 500.00, 'Garantia adicional de 2 anos'),
('Manutenção preventiva', 200.00, 'Pacote de manutenção anual'),
('Certificado de conformidade', 100.00, 'Certificado técnico'),
('Seguro contra roubo', 250.00, 'Seguro adicional');

-- RLS policies para acessórios
ALTER TABLE public.acessorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver acessórios ativos" 
ON public.acessorios 
FOR SELECT 
USING (ativo = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem gerenciar acessórios" 
ON public.acessorios 
FOR ALL 
USING (is_admin());

-- RLS policies para adicionais
ALTER TABLE public.adicionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver adicionais ativos" 
ON public.adicionais 
FOR SELECT 
USING (ativo = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem gerenciar adicionais" 
ON public.adicionais 
FOR ALL 
USING (is_admin());

-- Trigger para updated_at nas novas tabelas
CREATE TRIGGER update_acessorios_updated_at
BEFORE UPDATE ON public.acessorios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adicionais_updated_at
BEFORE UPDATE ON public.adicionais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();