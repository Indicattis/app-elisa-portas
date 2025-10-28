-- Remover policy antiga
DROP POLICY IF EXISTS "Usuários podem ver suas tarefas" ON public.tarefas;

-- Nova policy: usuários podem ver tarefas do seu setor OU suas próprias tarefas
CREATE POLICY "Usuários podem ver tarefas do setor"
  ON public.tarefas
  FOR SELECT
  TO authenticated
  USING (
    responsavel_id = auth.uid() 
    OR 
    (
      setor IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.user_id = auth.uid() 
        AND au.ativo = true
        AND (
          -- Diretor e Admin veem tudo
          au.role IN ('diretor', 'administrador')
          OR
          -- Ou role do usuário pertence ao setor da tarefa
          (
            (setor = 'vendas' AND au.role IN ('gerente_comercial', 'coordenador_vendas', 'vendedor'))
            OR (setor = 'marketing' AND au.role IN ('gerente_marketing', 'analista_marketing', 'assistente_marketing'))
            OR (setor = 'instalacoes' AND au.role IN ('gerente_instalacoes', 'instalador', 'aux_instalador'))
            OR (setor = 'fabrica' AND au.role IN ('gerente_fabril', 'gerente_producao', 'soldador', 'pintor', 'aux_pintura', 'aux_geral'))
            OR (setor = 'administrativo' AND au.role IN ('diretor', 'administrador', 'gerente_financeiro', 'assistente_administrativo', 'atendente'))
          )
        )
      )
    )
  );