-- Criar enum para tipo de parceiro
CREATE TYPE tipo_parceiro AS ENUM ('autorizado', 'representante', 'licenciado');

-- Criar enum para etapas de representantes
CREATE TYPE representante_etapa AS ENUM ('inicial', 'qualificacao', 'proposta', 'contratado');

-- Criar enum para etapas de licenciados
CREATE TYPE licenciado_etapa AS ENUM ('inicial', 'avaliacao', 'aprovacao', 'ativo');

-- Adicionar campo tipo_parceiro na tabela autorizados
ALTER TABLE public.autorizados ADD COLUMN tipo_parceiro tipo_parceiro NOT NULL DEFAULT 'autorizado';

-- Adicionar campos de etapas específicas para representantes e licenciados
ALTER TABLE public.autorizados ADD COLUMN representante_etapa representante_etapa DEFAULT NULL;
ALTER TABLE public.autorizados ADD COLUMN licenciado_etapa licenciado_etapa DEFAULT NULL;

-- Atualizar o enum rating_categoria para incluir novas categorias
ALTER TYPE rating_categoria ADD VALUE 'representante_vendas';
ALTER TYPE rating_categoria ADD VALUE 'representante_suporte';
ALTER TYPE rating_categoria ADD VALUE 'licenciado_compliance';
ALTER TYPE rating_categoria ADD VALUE 'licenciado_vendas';

-- Atualizar a aba "Autorizados" para "Parceiros" na tabela app_tabs
UPDATE public.app_tabs 
SET label = 'Parceiros', 
    key = 'parceiros',
    href = '/dashboard/parceiros'
WHERE key = 'autorizados';

-- Criar dados de teste
-- Inserir um representante de teste
INSERT INTO public.autorizados (
  nome, 
  email, 
  telefone, 
  whatsapp, 
  responsavel, 
  endereco, 
  cidade, 
  estado, 
  cep, 
  regiao,
  tipo_parceiro,
  representante_etapa,
  ativo
) VALUES (
  'Representante Exemplo Ltda',
  'contato@representanteexemplo.com.br',
  '(11) 98765-4321',
  '11987654321',
  'João Silva',
  'Rua das Flores, 123',
  'São Paulo',
  'SP',
  '01234-567',
  'Sudeste',
  'representante',
  'qualificacao',
  true
);

-- Inserir um licenciado de teste
INSERT INTO public.autorizados (
  nome, 
  email, 
  telefone, 
  whatsapp, 
  responsavel, 
  endereco, 
  cidade, 
  estado, 
  cep, 
  regiao,
  tipo_parceiro,
  licenciado_etapa,
  ativo
) VALUES (
  'Licenciado Premium S.A.',
  'admin@licenciadopremium.com.br',
  '(21) 91234-5678',
  '21912345678',
  'Maria Santos',
  'Av. Copacabana, 456',
  'Rio de Janeiro',
  'RJ',
  '22070-000',
  'Sudeste',
  'licenciado',
  'avaliacao',
  true
);

-- Criar índices para performance
CREATE INDEX idx_autorizados_tipo_parceiro ON public.autorizados(tipo_parceiro);
CREATE INDEX idx_autorizados_representante_etapa ON public.autorizados(representante_etapa);
CREATE INDEX idx_autorizados_licenciado_etapa ON public.autorizados(licenciado_etapa);