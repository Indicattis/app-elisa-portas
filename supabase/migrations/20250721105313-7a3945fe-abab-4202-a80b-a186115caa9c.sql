-- Criar tabela de cores do catálogo
CREATE TABLE public.catalogo_cores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  codigo_hex text NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.catalogo_cores ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso - todos podem visualizar cores ativas
CREATE POLICY "Usuários podem visualizar cores ativas" 
ON public.catalogo_cores 
FOR SELECT 
USING (ativa = true);

-- Admins podem gerenciar cores
CREATE POLICY "Admins podem gerenciar cores" 
ON public.catalogo_cores 
FOR ALL 
USING (is_admin());

-- Inserir as cores do catálogo
INSERT INTO public.catalogo_cores (nome, codigo_hex) VALUES
('Cinza Claro', '#616161'),
('Preto Fosco', '#14181e'),
('Cinza Escuro', '#2b2b2b'),
('Marrom Escuro', '#50260c'),
('Cinza Metálico', '#696969'),
('Azul Claro', '#0061aa'),
('Branco', '#FFFFFF'),
('Preto', '#000000'),
('Azul Escuro', '#224d94'),
('Vermelho', '#b80000'),
('Verde Claro', '#007932'),
('Amarelo', '#906500'),
('Verde Escuro', '#2d533a'),
('Laranja', '#c63000'),
('Bege', '#8f6b54');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_catalogo_cores_updated_at
BEFORE UPDATE ON public.catalogo_cores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();