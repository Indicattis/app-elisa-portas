-- Remove all complex RLS policies and create simple authenticated user policies

-- Drop existing policies for all main tables
DROP POLICY IF EXISTS "Admins podem gerenciar acessórios" ON acessorios;
DROP POLICY IF EXISTS "Usuários autenticados podem ver acessórios ativos" ON acessorios;

DROP POLICY IF EXISTS "Admins podem gerenciar adicionais" ON adicionais;
DROP POLICY IF EXISTS "Usuários autenticados podem ver adicionais ativos" ON adicionais;

DROP POLICY IF EXISTS "Admins podem atualizar admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins podem ver outros admins" ON admin_users;
DROP POLICY IF EXISTS "Public users can view active attendants" ON admin_users;
DROP POLICY IF EXISTS "Users with permission can create admin_users" ON admin_users;
DROP POLICY IF EXISTS "Users with permission can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Users with permission can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Usuários podem atualizar sua própria foto de perfil" ON admin_users;

DROP POLICY IF EXISTS "Admins podem gerenciar abas" ON app_tabs;
DROP POLICY IF EXISTS "Usuários autenticados podem ver abas ativas" ON app_tabs;

DROP POLICY IF EXISTS "Admins podem gerenciar autorizados" ON autorizados;
DROP POLICY IF EXISTS "Público pode visualizar autorizados ativos" ON autorizados;

DROP POLICY IF EXISTS "Gerentes fabris e admins podem gerenciar cores" ON calendario_cores;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem ver cores" ON calendario_cores;

DROP POLICY IF EXISTS "Admins podem gerenciar canais de aquisição" ON canais_aquisicao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver canais ativos" ON canais_aquisicao;

DROP POLICY IF EXISTS "Admins podem gerenciar cores" ON catalogo_cores;
DROP POLICY IF EXISTS "Usuários podem visualizar cores ativas" ON catalogo_cores;

DROP POLICY IF EXISTS "Admins podem deletar vendas" ON contador_vendas_dias;
DROP POLICY IF EXISTS "Atendentes podem atualizar suas próprias vendas" ON contador_vendas_dias;
DROP POLICY IF EXISTS "Atendentes podem criar suas próprias vendas" ON contador_vendas_dias;
DROP POLICY IF EXISTS "Atendentes podem ver todas as vendas" ON contador_vendas_dias;

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar contas a receber" ON contas_receber;
DROP POLICY IF EXISTS "Usuários autenticados podem criar contas a receber" ON contas_receber;
DROP POLICY IF EXISTS "Usuários autenticados podem ver contas a receber" ON contas_receber;

DROP POLICY IF EXISTS "Admins podem deletar leads" ON elisaportas_leads;
DROP POLICY IF EXISTS "Controle de atualização de leads por role" ON elisaportas_leads;
DROP POLICY IF EXISTS "Controle de visualização de leads por role" ON elisaportas_leads;
DROP POLICY IF EXISTS "Inserção pública de leads" ON elisaportas_leads;

DROP POLICY IF EXISTS "Gerentes fabris e admins podem gerenciar equipes de instalaçã" ON equipes_instalacao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver equipes ativas" ON equipes_instalacao;

DROP POLICY IF EXISTS "Criadores e admins podem atualizar eventos" ON eventos_calendario;
DROP POLICY IF EXISTS "Criadores e admins podem deletar eventos" ON eventos_calendario;
DROP POLICY IF EXISTS "Usuários autenticados podem criar eventos" ON eventos_calendario;
DROP POLICY IF EXISTS "Usuários autenticados podem ver eventos" ON eventos_calendario;

DROP POLICY IF EXISTS "Usuários autenticados podem adicionar membros" ON eventos_membros;
DROP POLICY IF EXISTS "Usuários autenticados podem ver membros de eventos" ON eventos_membros;
DROP POLICY IF EXISTS "Usuários podem remover membros de eventos que criaram" ON eventos_membros;

DROP POLICY IF EXISTS "Admins podem visualizar todos os anexos" ON lead_anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir anexos" ON lead_anexos;

DROP POLICY IF EXISTS "Admins e atendentes podem ver histórico" ON lead_atendimento_historico;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico" ON lead_atendimento_historico;

DROP POLICY IF EXISTS "Admins e autores podem deletar comentários" ON lead_comentarios;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir comentários" ON lead_comentarios;
DROP POLICY IF EXISTS "Usuários podem editar próprios comentários" ON lead_comentarios;
DROP POLICY IF EXISTS "Usuários podem ver comentários dos leads que têm acesso" ON lead_comentarios;

DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico de etiquetas" ON lead_etiqueta_historico;
DROP POLICY IF EXISTS "Usuários podem ver histórico de etiquetas dos leads que têm " ON lead_etiqueta_historico;

DROP POLICY IF EXISTS "Gerentes fabris e admins podem atualizar linhas de ordens" ON linhas_ordens;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem criar linhas de ordens" ON linhas_ordens;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem deletar linhas de ordens" ON linhas_ordens;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem ver linhas de ordens" ON linhas_ordens;

DROP POLICY IF EXISTS "Admins e gerentes podem atualizar investimentos" ON marketing_investimentos;
DROP POLICY IF EXISTS "Admins e gerentes podem criar investimentos" ON marketing_investimentos;
DROP POLICY IF EXISTS "Admins e gerentes podem ver investimentos" ON marketing_investimentos;

DROP POLICY IF EXISTS "Apenas admins podem atualizar numeração" ON numeracao_controle;
DROP POLICY IF EXISTS "Usuários autenticados podem ver numeração" ON numeracao_controle;

DROP POLICY IF EXISTS "Usuários autenticados podem ver custos de orçamentos" ON orcamento_custos;
DROP POLICY IF EXISTS "Usuários podem atualizar custos dos próprios orçamentos" ON orcamento_custos;
DROP POLICY IF EXISTS "Usuários podem criar custos nos orçamentos" ON orcamento_custos;
DROP POLICY IF EXISTS "Usuários podem deletar custos dos próprios orçamentos" ON orcamento_custos;

DROP POLICY IF EXISTS "Usuários autenticados podem ver produtos de todos os orçament" ON orcamento_produtos;
DROP POLICY IF EXISTS "Usuários podem atualizar produtos dos orçamentos" ON orcamento_produtos;
DROP POLICY IF EXISTS "Usuários podem criar produtos nos orçamentos" ON orcamento_produtos;
DROP POLICY IF EXISTS "Usuários podem deletar produtos dos orçamentos" ON orcamento_produtos;

DROP POLICY IF EXISTS "Admins e proprietários podem deletar orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Atendentes podem criar orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Atendentes podem ver todos os orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Gerentes podem aprovar orçamentos" ON orcamentos;
DROP POLICY IF EXISTS "Usuários podem editar próprios orçamentos" ON orcamentos;

-- Continue dropping policies for remaining tables...
DROP POLICY IF EXISTS "Gerentes fabris e admins podem atualizar ordens de instalação" ON ordens_instalacao;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem criar ordens de instalação" ON ordens_instalacao;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem ver ordens de instalação" ON ordens_instalacao;

DROP POLICY IF EXISTS "Gerentes fabris e admins podem atualizar ordens de perfiladeira" ON ordens_perfiladeira;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem criar ordens de perfiladeira" ON ordens_perfiladeira;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem ver ordens de perfiladeira" ON ordens_perfiladeira;

DROP POLICY IF EXISTS "Gerentes fabris e admins podem atualizar ordens de pintura" ON ordens_pintura;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem criar ordens de pintura" ON ordens_pintura;
DROP POLICY IF EXISTS "Gerentes fabris e admins podem ver ordens de pintura" ON ordens_pintura;

-- Create simple authenticated user policies for all tables
-- acessorios
CREATE POLICY "Authenticated users can manage acessorios" ON acessorios FOR ALL USING (auth.uid() IS NOT NULL);

-- adicionais
CREATE POLICY "Authenticated users can manage adicionais" ON adicionais FOR ALL USING (auth.uid() IS NOT NULL);

-- admin_users
CREATE POLICY "Authenticated users can view admin_users" ON admin_users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create admin_users" ON admin_users FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update admin_users" ON admin_users FOR UPDATE USING (auth.uid() IS NOT NULL);

-- app_tabs
CREATE POLICY "Authenticated users can view app_tabs" ON app_tabs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage app_tabs" ON app_tabs FOR ALL USING (auth.uid() IS NOT NULL);

-- autorizados
CREATE POLICY "Everyone can view autorizados" ON autorizados FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage autorizados" ON autorizados FOR ALL USING (auth.uid() IS NOT NULL);

-- calendario_cores
CREATE POLICY "Authenticated users can manage calendario_cores" ON calendario_cores FOR ALL USING (auth.uid() IS NOT NULL);

-- canais_aquisicao
CREATE POLICY "Authenticated users can manage canais_aquisicao" ON canais_aquisicao FOR ALL USING (auth.uid() IS NOT NULL);

-- catalogo_cores
CREATE POLICY "Authenticated users can manage catalogo_cores" ON catalogo_cores FOR ALL USING (auth.uid() IS NOT NULL);

-- contador_vendas_dias
CREATE POLICY "Authenticated users can manage contador_vendas_dias" ON contador_vendas_dias FOR ALL USING (auth.uid() IS NOT NULL);

-- contas_receber
CREATE POLICY "Authenticated users can view contas_receber" ON contas_receber FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create contas_receber" ON contas_receber FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update contas_receber" ON contas_receber FOR UPDATE USING (auth.uid() IS NOT NULL);

-- elisaportas_leads (keep public insert for forms)
CREATE POLICY "Public can insert leads" ON elisaportas_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can manage leads" ON elisaportas_leads FOR ALL USING (auth.uid() IS NOT NULL);

-- equipes_instalacao
CREATE POLICY "Authenticated users can manage equipes_instalacao" ON equipes_instalacao FOR ALL USING (auth.uid() IS NOT NULL);

-- eventos_calendario
CREATE POLICY "Authenticated users can manage eventos_calendario" ON eventos_calendario FOR ALL USING (auth.uid() IS NOT NULL);

-- eventos_membros
CREATE POLICY "Authenticated users can view eventos_membros" ON eventos_membros FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create eventos_membros" ON eventos_membros FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete eventos_membros" ON eventos_membros FOR DELETE USING (auth.uid() IS NOT NULL);

-- lead_anexos
CREATE POLICY "Authenticated users can view lead_anexos" ON lead_anexos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create lead_anexos" ON lead_anexos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- lead_atendimento_historico
CREATE POLICY "Authenticated users can view lead_atendimento_historico" ON lead_atendimento_historico FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create lead_atendimento_historico" ON lead_atendimento_historico FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- lead_comentarios
CREATE POLICY "Authenticated users can manage lead_comentarios" ON lead_comentarios FOR ALL USING (auth.uid() IS NOT NULL);

-- lead_etiqueta_historico
CREATE POLICY "Authenticated users can view lead_etiqueta_historico" ON lead_etiqueta_historico FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create lead_etiqueta_historico" ON lead_etiqueta_historico FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- linhas_ordens
CREATE POLICY "Authenticated users can manage linhas_ordens" ON linhas_ordens FOR ALL USING (auth.uid() IS NOT NULL);

-- marketing_investimentos
CREATE POLICY "Authenticated users can view marketing_investimentos" ON marketing_investimentos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create marketing_investimentos" ON marketing_investimentos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update marketing_investimentos" ON marketing_investimentos FOR UPDATE USING (auth.uid() IS NOT NULL);

-- numeracao_controle
CREATE POLICY "Authenticated users can view numeracao_controle" ON numeracao_controle FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update numeracao_controle" ON numeracao_controle FOR UPDATE USING (auth.uid() IS NOT NULL);

-- orcamento_custos
CREATE POLICY "Authenticated users can manage orcamento_custos" ON orcamento_custos FOR ALL USING (auth.uid() IS NOT NULL);

-- orcamento_produtos
CREATE POLICY "Authenticated users can manage orcamento_produtos" ON orcamento_produtos FOR ALL USING (auth.uid() IS NOT NULL);

-- orcamentos
CREATE POLICY "Authenticated users can manage orcamentos" ON orcamentos FOR ALL USING (auth.uid() IS NOT NULL);

-- ordens_instalacao
CREATE POLICY "Authenticated users can view ordens_instalacao" ON ordens_instalacao FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create ordens_instalacao" ON ordens_instalacao FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update ordens_instalacao" ON ordens_instalacao FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ordens_perfiladeira
CREATE POLICY "Authenticated users can view ordens_perfiladeira" ON ordens_perfiladeira FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create ordens_perfiladeira" ON ordens_perfiladeira FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update ordens_perfiladeira" ON ordens_perfiladeira FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ordens_pintura
CREATE POLICY "Authenticated users can view ordens_pintura" ON ordens_pintura FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create ordens_pintura" ON ordens_pintura FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update ordens_pintura" ON ordens_pintura FOR UPDATE USING (auth.uid() IS NOT NULL);