-- Tabela de pedidos de produção
CREATE TABLE public.pedidos_producao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido text NOT NULL UNIQUE,
  venda_id uuid REFERENCES public.vendas(id),
  cliente_nome text NOT NULL,
  cliente_telefone text,
  produto_tipo text NOT NULL,
  produto_cor text NOT NULL,
  produto_altura text NOT NULL,
  produto_largura text NOT NULL,
  data_entrega date,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Tabela de ordens de produção
CREATE TABLE public.ordens_producao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id uuid NOT NULL REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  tipo_ordem text NOT NULL CHECK (tipo_ordem IN ('perfiladeira', 'soldagem', 'pintura', 'separacao', 'instalacao', 'porta_social')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  responsavel_id uuid REFERENCES auth.users(id),
  data_inicio timestamp with time zone,
  data_conclusao timestamp with time zone,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Tabela de cores para o calendário de produção
CREATE TABLE public.calendario_cores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_producao date NOT NULL,
  cor text NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.pedidos_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_cores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pedidos_producao
CREATE POLICY "Gerentes fabris e admins podem ver pedidos"
ON public.pedidos_producao FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar pedidos"
ON public.pedidos_producao FOR INSERT
WITH CHECK (
  (is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )) AND created_by = auth.uid()
);

CREATE POLICY "Gerentes fabris e admins podem atualizar pedidos"
ON public.pedidos_producao FOR UPDATE
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Políticas RLS para ordens_producao
CREATE POLICY "Gerentes fabris e admins podem ver ordens"
ON public.ordens_producao FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar ordens"
ON public.ordens_producao FOR INSERT
WITH CHECK (
  (is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )) AND created_by = auth.uid()
);

CREATE POLICY "Gerentes fabris e admins podem atualizar ordens"
ON public.ordens_producao FOR UPDATE
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Políticas RLS para calendario_cores
CREATE POLICY "Gerentes fabris e admins podem ver cores"
ON public.calendario_cores FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem gerenciar cores"
ON public.calendario_cores FOR ALL
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pedidos_producao_updated_at
BEFORE UPDATE ON public.pedidos_producao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_producao_updated_at
BEFORE UPDATE ON public.ordens_producao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();