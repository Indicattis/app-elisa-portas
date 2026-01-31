-- Adicionar rotas do Estoque da Direção ao sistema de permissões
INSERT INTO app_routes (key, label, path, interface, parent_key, sort_order, active)
VALUES 
  ('direcao_estoque_hub', 'Estoque', '/direcao/estoque', 'padrao', 'direcao_hub', 90, true),
  ('direcao_estoque_config', 'Configurações', '/direcao/estoque/configuracoes', 'padrao', 'direcao_estoque_hub', 91, true),
  ('direcao_estoque_produtos', 'Produtos', '/direcao/estoque/configuracoes/produtos', 'padrao', 'direcao_estoque_config', 92, true),
  ('direcao_estoque_fornecedores', 'Fornecedores', '/direcao/estoque/configuracoes/fornecedores', 'padrao', 'direcao_estoque_config', 93, true),
  ('direcao_estoque_auditoria_fab', 'Auditoria Fábrica', '/direcao/estoque/auditoria/fabrica', 'padrao', 'direcao_estoque_hub', 94, true),
  ('direcao_estoque_auditoria_alm', 'Auditoria Almoxarifado', '/direcao/estoque/auditoria/almoxarifado', 'padrao', 'direcao_estoque_hub', 95, true)
ON CONFLICT (key) DO UPDATE SET 
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order;