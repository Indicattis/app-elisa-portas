-- 1) Adiciona a coluna de quantidade nos produtos do orçamento (compatível com dados existentes)
ALTER TABLE public.orcamento_produtos
  ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1;

-- 2) Atualiza a função que calcula o valor total de produtos (passa a considerar a quantidade)
CREATE OR REPLACE FUNCTION public.calcular_valor_produto_orcamento(orcamento_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  valor_produtos numeric := 0;
BEGIN
  SELECT COALESCE(SUM(valor * COALESCE(quantidade, 1)), 0)
  INTO valor_produtos
  FROM public.orcamento_produtos
  WHERE orcamento_id = orcamento_uuid;

  RETURN valor_produtos;
END;
$function$;

-- 3) Cria a tabela de custos logísticos em formato de itens (mantendo as colunas agregadas no orçamento por gatilho)
CREATE TABLE IF NOT EXISTS public.orcamento_custos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL,
  tipo text NOT NULL,              -- 'frete' ou 'instalacao'
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) RLS e políticas (seguem o mesmo padrão de orcamento_produtos)
ALTER TABLE public.orcamento_custos ENABLE ROW LEVEL SECURITY;

-- Visualização: autenticados com perfis autorizados (ou admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orcamento_custos'
      AND policyname = 'Usuários autenticados podem ver custos de orçamentos'
  ) THEN
    CREATE POLICY "Usuários autenticados podem ver custos de orçamentos"
      ON public.orcamento_custos
      FOR SELECT
      USING (
        (auth.uid() IS NOT NULL)
        AND (
          is_admin()
          OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.user_id = auth.uid()
              AND admin_users.ativo = true
              AND admin_users.role = ANY (ARRAY['atendente'::user_role, 'gerente_comercial'::user_role, 'gerente_fabril'::user_role])
          )
        )
      );
  END IF;
END$$;

-- Inserção: qualquer usuário autenticado (como em orcamento_produtos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orcamento_custos'
      AND policyname = 'Usuários podem criar custos nos orçamentos'
  ) THEN
    CREATE POLICY "Usuários podem criar custos nos orçamentos"
      ON public.orcamento_custos
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Atualização: dono do orçamento (atendente) ou admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orcamento_custos'
      AND policyname = 'Usuários podem atualizar custos dos próprios orçamentos'
  ) THEN
    CREATE POLICY "Usuários podem atualizar custos dos próprios orçamentos"
      ON public.orcamento_custos
      FOR UPDATE
      USING (
        (auth.uid() IS NOT NULL)
        AND (
          is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orcamentos o
            WHERE o.id = orcamento_custos.orcamento_id
              AND o.atendente_id = auth.uid()
          )
        )
      );
  END IF;
END$$;

-- Deleção: dono do orçamento (atendente) ou admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orcamento_custos'
      AND policyname = 'Usuários podem deletar custos dos próprios orçamentos'
  ) THEN
    CREATE POLICY "Usuários podem deletar custos dos próprios orçamentos"
      ON public.orcamento_custos
      FOR DELETE
      USING (
        (auth.uid() IS NOT NULL)
        AND (
          is_admin()
          OR EXISTS (
            SELECT 1 FROM public.orcamentos o
            WHERE o.id = orcamento_custos.orcamento_id
              AND o.atendente_id = auth.uid()
          )
        )
      );
  END IF;
END$$;

-- 5) Mantém updated_at em orcamento_custos
DROP TRIGGER IF EXISTS set_timestamp_on_orcamento_custos ON public.orcamento_custos;
CREATE TRIGGER set_timestamp_on_orcamento_custos
BEFORE UPDATE ON public.orcamento_custos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Gatilho para atualizar automaticamente valor_frete e valor_instalacao no orçamento
CREATE OR REPLACE FUNCTION public.atualizar_valor_custos_orcamento()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  soma_frete numeric := 0;
  soma_instalacao numeric := 0;
  target_orcamento uuid;
BEGIN
  target_orcamento := COALESCE(NEW.orcamento_id, OLD.orcamento_id);

  SELECT COALESCE(SUM(valor), 0) INTO soma_frete
  FROM public.orcamento_custos
  WHERE orcamento_id = target_orcamento AND lower(tipo) = 'frete';

  SELECT COALESCE(SUM(valor), 0) INTO soma_instalacao
  FROM public.orcamento_custos
  WHERE orcamento_id = target_orcamento AND lower(tipo) = 'instalacao';

  UPDATE public.orcamentos
  SET valor_frete = soma_frete,
      valor_instalacao = soma_instalacao
  WHERE id = target_orcamento;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS orcamento_custos_after_insert ON public.orcamento_custos;
DROP TRIGGER IF EXISTS orcamento_custos_after_update ON public.orcamento_custos;
DROP TRIGGER IF EXISTS orcamento_custos_after_delete ON public.orcamento_custos;

CREATE TRIGGER orcamento_custos_after_insert
AFTER INSERT ON public.orcamento_custos
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_custos_orcamento();

CREATE TRIGGER orcamento_custos_after_update
AFTER UPDATE ON public.orcamento_custos
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_custos_orcamento();

CREATE TRIGGER orcamento_custos_after_delete
AFTER DELETE ON public.orcamento_custos
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_custos_orcamento();

-- 7) Índice para performance
CREATE INDEX IF NOT EXISTS idx_orcamento_custos_orcamento_id
  ON public.orcamento_custos (orcamento_id);