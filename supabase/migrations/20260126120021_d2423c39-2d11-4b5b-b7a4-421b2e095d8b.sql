INSERT INTO app_routes (key, path, label, description, interface, parent_key, sort_order, active) VALUES
-- Logística
('logistica_frete', '/logistica/frete', 'Frete', 'Gerenciamento de valores de frete por cidade', 'padrao', 'logistica_hub', 5, true),

-- Vendas
('vendas_catalogo_minimalista', '/vendas/catalogo', 'Catálogo', 'Catálogo de produtos', 'padrao', 'vendas_hub', 5, true),
('vendas_acompanhar_pedido', '/vendas/acompanhar-pedido', 'Acompanhar Pedido', 'Acompanhamento de pedidos do cliente', 'padrao', 'vendas_hub', 6, true),

-- Direção
('direcao_metas_fabrica', '/direcao/metas/fabrica', 'Metas Fábrica', 'Metas de produção da fábrica', 'padrao', 'direcao_metas', 1, true),
('direcao_ordens_instalacoes', '/direcao/gestao-instalacao/ordens-instalacoes', 'Ordens de Instalações', 'Gerenciamento de ordens de instalação', 'padrao', 'direcao_gestao_instalacao', 1, true),

-- Administrativo - Documentos
('admin_documentos', '/administrativo/documentos', 'Documentos', 'Gestão de documentos', 'padrao', 'administrativo_hub', 6, true),

-- Administrativo - Cobranças
('admin_cobrancas', '/administrativo/financeiro/cobrancas', 'Cobranças', 'Gestão de cobranças', 'padrao', 'admin_financeiro', 4, true),

-- Administrativo - RH/DP
('admin_rh_dp_hub', '/administrativo/rh-dp', 'RH/DP', 'Hub de Recursos Humanos e Departamento Pessoal', 'padrao', 'administrativo_hub', 2, true),
('admin_rh_dp_colaboradores', '/administrativo/rh-dp/colaboradores', 'Colaboradores', 'Gestão de colaboradores', 'padrao', 'admin_rh_dp_hub', 1, true),

-- Administrativo - Compras
('admin_compras_hub', '/administrativo/compras', 'Compras & Suprimentos', 'Hub de Compras e Suprimentos', 'padrao', 'administrativo_hub', 3, true),
('admin_compras_estoque', '/administrativo/compras/estoque', 'Estoque', 'Controle de estoque', 'padrao', 'admin_compras_hub', 1, true),
('admin_compras_requisicoes', '/administrativo/compras/requisicoes', 'Requisições', 'Requisições de compra', 'padrao', 'admin_compras_hub', 2, true),
('admin_compras_fornecedores', '/administrativo/compras/fornecedores', 'Fornecedores', 'Cadastro de fornecedores', 'padrao', 'admin_compras_hub', 3, true),

-- Administrativo - Fiscal
('admin_fiscal_hub', '/administrativo/fiscal', 'Fiscal & Contábil', 'Hub de Fiscal e Contábil', 'padrao', 'administrativo_hub', 4, true),
('admin_fiscal_notas', '/administrativo/fiscal/notas-fiscais', 'Notas Fiscais', 'Gestão de notas fiscais', 'padrao', 'admin_fiscal_hub', 1, true),
('admin_fiscal_emitir_nfe', '/administrativo/fiscal/notas-fiscais/emitir-nfe', 'Emitir NF-e', 'Emissão de NF-e', 'padrao', 'admin_fiscal_notas', 1, true),
('admin_fiscal_emitir_nfse', '/administrativo/fiscal/notas-fiscais/emitir-nfse', 'Emitir NFS-e', 'Emissão de NFS-e', 'padrao', 'admin_fiscal_notas', 2, true),
('admin_fiscal_configuracoes', '/administrativo/fiscal/configuracoes', 'Configurações Fiscais', 'Configurações do módulo fiscal', 'padrao', 'admin_fiscal_hub', 2, true)

ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  interface = EXCLUDED.interface,
  parent_key = EXCLUDED.parent_key,
  active = EXCLUDED.active;