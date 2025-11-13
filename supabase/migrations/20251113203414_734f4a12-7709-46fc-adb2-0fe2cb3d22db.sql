-- Permitir que todos os usuários autenticados vejam ordens que não estão na lixeira (historico = false)

-- Adicionar políticas para ordens_qualidade
CREATE POLICY "Autenticados podem ver ordens de qualidade ativas"
ON ordens_qualidade
FOR SELECT
TO authenticated
USING (historico = false OR historico IS NULL);

CREATE POLICY "Autenticados podem criar ordens de qualidade"
ON ordens_qualidade
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adicionar políticas para ordens_pintura
CREATE POLICY "Autenticados podem ver ordens de pintura ativas"
ON ordens_pintura
FOR SELECT
TO authenticated
USING (historico = false OR historico IS NULL);

CREATE POLICY "Autenticados podem criar ordens de pintura"
ON ordens_pintura
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Atualizar políticas existentes de soldagem e separacao para incluir o filtro de histórico
DROP POLICY IF EXISTS "Autenticados podem ver ordens de soldagem" ON ordens_soldagem;
CREATE POLICY "Autenticados podem ver ordens de soldagem ativas"
ON ordens_soldagem
FOR SELECT
TO authenticated
USING (historico = false OR historico IS NULL);

DROP POLICY IF EXISTS "Autenticados podem ver ordens de separacao" ON ordens_separacao;
CREATE POLICY "Autenticados podem ver ordens de separacao ativas"
ON ordens_separacao
FOR SELECT
TO authenticated
USING (historico = false OR historico IS NULL);