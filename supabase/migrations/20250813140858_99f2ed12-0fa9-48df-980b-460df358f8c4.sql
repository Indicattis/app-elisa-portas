-- Fix RLS policy for orcamento_produtos to allow insertions by authenticated users
DROP POLICY IF EXISTS "Usuários podem criar produtos nos orçamentos" ON public.orcamento_produtos;

CREATE POLICY "Usuários podem criar produtos nos orçamentos" 
ON public.orcamento_produtos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);