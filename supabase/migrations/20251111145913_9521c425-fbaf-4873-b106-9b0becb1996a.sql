-- Adicionar colunas interface e parent_key à tabela app_routes
ALTER TABLE app_routes 
ADD COLUMN IF NOT EXISTS interface TEXT DEFAULT 'dashboard',
ADD COLUMN IF NOT EXISTS parent_key TEXT REFERENCES app_routes(key);

-- Atualizar rotas existentes com suas interfaces baseado no path
UPDATE app_routes SET interface = 'dashboard' WHERE path LIKE '/dashboard/%';
UPDATE app_routes SET interface = 'producao' WHERE path LIKE '/producao/%';
UPDATE app_routes SET interface = 'admin' WHERE path LIKE '/admin/%';
UPDATE app_routes SET interface = 'paineis' WHERE path LIKE '/paineis/%';
UPDATE app_routes SET interface = 'tarefas' WHERE key = 'todo';

-- Atualizar rota admin que não tem /admin no path
UPDATE app_routes SET interface = 'admin' WHERE key = 'admin';

-- Atualizar rota administrativo que tem path /administrativo
UPDATE app_routes SET interface = 'dashboard' WHERE key = 'administrativo_home';

-- Definir hierarquia de rotas (parent_key) - VENDAS
UPDATE app_routes SET parent_key = 'vendas_home' WHERE key IN (
  'vendas_nova',
  'vendas_catalogo', 
  'tabela_precos',
  'visitas',
  'orcamentos',
  'autorizados',
  'representantes', 
  'franqueados'
);

-- FÁBRICA
UPDATE app_routes SET parent_key = 'fabrica_home' WHERE key IN (
  'pedidos',
  'ordens',
  'producao_solda',
  'producao_perfiladeira',
  'producao_separacao',
  'producao_pintura',
  'producao_qualidade',
  'producao_carregamento',
  'historico_producao',
  'etiquetas'
);

-- INSTALAÇÕES
UPDATE app_routes SET parent_key = 'instalacoes_home' WHERE key IN (
  'instalacoes_cadastradas',
  'cronograma_instalacoes'
);

-- LOGÍSTICA
UPDATE app_routes SET parent_key = 'logistica_home' WHERE key IN (
  'entregas',
  'frota'
);

-- MARKETING
UPDATE app_routes SET parent_key = 'marketing' WHERE key = 'canais_aquisicao';

-- ADMINISTRATIVO
UPDATE app_routes SET parent_key = 'administrativo_home' WHERE key IN (
  'vagas',
  'documentos'
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_app_routes_interface ON app_routes(interface);
CREATE INDEX IF NOT EXISTS idx_app_routes_parent_key ON app_routes(parent_key);