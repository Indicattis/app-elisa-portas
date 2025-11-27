
-- Remover políticas RLS que bloqueiam visualização de ordens históricas
-- Estas políticas impedem que ordens com historico = true sejam visíveis

DROP POLICY IF EXISTS "Autenticados podem ver ordens de soldagem ativas" ON ordens_soldagem;
DROP POLICY IF EXISTS "Autenticados podem ver ordens de separacao ativas" ON ordens_separacao;
DROP POLICY IF EXISTS "Autenticados podem ver ordens de qualidade ativas" ON ordens_qualidade;
DROP POLICY IF EXISTS "Autenticados podem ver ordens de pintura ativas" ON ordens_pintura;

-- As políticas genéricas "Authenticated users can view" já permitem
-- acesso a todas as ordens (incluindo historico = true) para usuários autenticados
