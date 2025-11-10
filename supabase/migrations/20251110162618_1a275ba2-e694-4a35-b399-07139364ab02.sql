-- Criar função auxiliar para verificar se usuário é operador de fábrica
CREATE OR REPLACE FUNCTION public.is_factory_operator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND setor = 'fabrica'
      AND ativo = true
  );
$$;

-- Criar contas auth para todos os operadores de fábrica existentes
DO $$
DECLARE
  operador RECORD;
  senha_padrao TEXT := 'Producao@2024'; -- Senha padrão para todos os operadores
BEGIN
  FOR operador IN 
    SELECT 
      codigo_usuario,
      nome,
      user_id
    FROM public.admin_users
    WHERE setor = 'fabrica' AND ativo = true
  LOOP
    -- Inserir usuário em auth.users se não existir
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      role,
      aud
    )
    VALUES (
      operador.user_id,
      '00000000-0000-0000-0000-000000000000',
      operador.codigo_usuario || '@producao.local',
      crypt(senha_padrao, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nome', operador.nome, 'codigo', operador.codigo_usuario),
      now(),
      now(),
      '',
      '',
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now();
  END LOOP;
END $$;

-- Atualizar políticas RLS de pintura_inicios para verificar operador de fábrica
DROP POLICY IF EXISTS "Permitir inserção de inicios de pintura" ON pintura_inicios;
DROP POLICY IF EXISTS "Permitir visualização de inicios de pintura" ON pintura_inicios;
DROP POLICY IF EXISTS "Permitir atualização de inicios de pintura" ON pintura_inicios;
DROP POLICY IF EXISTS "Permitir exclusão de inicios de pintura" ON pintura_inicios;

CREATE POLICY "Operadores de fábrica podem inserir inicios"
ON pintura_inicios
FOR INSERT
TO authenticated
WITH CHECK (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem visualizar inicios"
ON pintura_inicios
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem atualizar inicios"
ON pintura_inicios
FOR UPDATE
TO authenticated
USING (is_factory_operator(auth.uid()))
WITH CHECK (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem deletar inicios"
ON pintura_inicios
FOR DELETE
TO authenticated
USING (is_factory_operator(auth.uid()));

-- Atualizar políticas RLS de ordens_pintura
DROP POLICY IF EXISTS "Operadores podem visualizar ordens de pintura" ON ordens_pintura;
DROP POLICY IF EXISTS "Operadores podem atualizar ordens de pintura" ON ordens_pintura;

CREATE POLICY "Operadores de fábrica podem visualizar ordens de pintura"
ON ordens_pintura
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem atualizar ordens de pintura"
ON ordens_pintura
FOR UPDATE
TO authenticated
USING (is_factory_operator(auth.uid()))
WITH CHECK (is_factory_operator(auth.uid()));

-- Atualizar políticas RLS de linhas_ordens
DROP POLICY IF EXISTS "Operadores podem visualizar linhas de ordens" ON linhas_ordens;
DROP POLICY IF EXISTS "Operadores podem atualizar linhas de ordens" ON linhas_ordens;

CREATE POLICY "Operadores de fábrica podem visualizar linhas de ordens"
ON linhas_ordens
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem atualizar linhas de ordens"
ON linhas_ordens
FOR UPDATE
TO authenticated
USING (is_factory_operator(auth.uid()))
WITH CHECK (is_factory_operator(auth.uid()));

-- Atualizar políticas RLS para outras tabelas de ordens (soldagem, perfiladeira, etc)
DROP POLICY IF EXISTS "Operadores podem visualizar ordens de soldagem" ON ordens_soldagem;
DROP POLICY IF EXISTS "Operadores podem atualizar ordens de soldagem" ON ordens_soldagem;

CREATE POLICY "Operadores de fábrica podem visualizar ordens de soldagem"
ON ordens_soldagem
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem atualizar ordens de soldagem"
ON ordens_soldagem
FOR UPDATE
TO authenticated
USING (is_factory_operator(auth.uid()))
WITH CHECK (is_factory_operator(auth.uid()));

DROP POLICY IF EXISTS "Operadores podem visualizar ordens de perfiladeira" ON ordens_perfiladeira;
DROP POLICY IF EXISTS "Operadores podem atualizar ordens de perfiladeira" ON ordens_perfiladeira;

CREATE POLICY "Operadores de fábrica podem visualizar ordens de perfiladeira"
ON ordens_perfiladeira
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem atualizar ordens de perfiladeira"
ON ordens_perfiladeira
FOR UPDATE
TO authenticated
USING (is_factory_operator(auth.uid()))
WITH CHECK (is_factory_operator(auth.uid()));

DROP POLICY IF EXISTS "Operadores podem visualizar ordens de separacao" ON ordens_separacao;
DROP POLICY IF EXISTS "Operadores podem atualizar ordens de separacao" ON ordens_separacao;

CREATE POLICY "Operadores de fábrica podem visualizar ordens de separacao"
ON ordens_separacao
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem atualizar ordens de separacao"
ON ordens_separacao
FOR UPDATE
TO authenticated
USING (is_factory_operator(auth.uid()))
WITH CHECK (is_factory_operator(auth.uid()));

DROP POLICY IF EXISTS "Operadores podem visualizar ordens de qualidade" ON ordens_qualidade;
DROP POLICY IF EXISTS "Operadores podem atualizar ordens de qualidade" ON ordens_qualidade;

CREATE POLICY "Operadores de fábrica podem visualizar ordens de qualidade"
ON ordens_qualidade
FOR SELECT
TO authenticated
USING (is_factory_operator(auth.uid()));

CREATE POLICY "Operadores de fábrica podem atualizar ordens de qualidade"
ON ordens_qualidade
FOR UPDATE
TO authenticated
USING (is_factory_operator(auth.uid()))
WITH CHECK (is_factory_operator(auth.uid()));