-- Adicionar nova rota para gerenciamento de equipes de instalação
INSERT INTO app_routes (
  key,
  path,
  label,
  description,
  "group",
  interface,
  sort_order,
  active
) VALUES (
  'instalacoes_equipes',
  '/instalacoes/equipes',
  'Gerenciar Equipes',
  'Criar, editar e gerenciar equipes de instalação e seus membros',
  'geral',
  'instalacoes',
  3,
  true
)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  "group" = EXCLUDED."group",
  interface = EXCLUDED.interface,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;