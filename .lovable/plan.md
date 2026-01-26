
## Plano: Atualizar Rotas Faltantes no app_routes

### Visão Geral

A tabela `app_routes` no banco de dados não contém todas as rotas existentes no `App.tsx`. Isso significa que essas rotas não podem ser gerenciadas no painel de permissões (`/admin/permissions`).

### Rotas a Adicionar

Serão adicionadas **18 rotas** distribuídas nas seguintes interfaces:

---

### Interface: Padrão

#### Logística
| key | label | path | parent_key |
|-----|-------|------|------------|
| `logistica_frete` | Frete | `/logistica/frete` | `logistica_hub` |

#### Vendas
| key | label | path | parent_key |
|-----|-------|------|------------|
| `vendas_catalogo_minimalista` | Catálogo | `/vendas/catalogo` | `vendas_hub` |
| `vendas_acompanhar_pedido` | Acompanhar Pedido | `/vendas/acompanhar-pedido` | `vendas_hub` |

#### Direção
| key | label | path | parent_key |
|-----|-------|------|------------|
| `direcao_metas_fabrica` | Metas Fábrica | `/direcao/metas/fabrica` | `direcao_metas` |
| `direcao_ordens_instalacoes` | Ordens de Instalações | `/direcao/gestao-instalacao/ordens-instalacoes` | `direcao_gestao_instalacao` |

#### Administrativo - Documentos
| key | label | path | parent_key |
|-----|-------|------|------------|
| `admin_documentos` | Documentos | `/administrativo/documentos` | `administrativo_hub` |

#### Administrativo - Cobranças
| key | label | path | parent_key |
|-----|-------|------|------------|
| `admin_cobrancas` | Cobranças | `/administrativo/financeiro/cobrancas` | `admin_financeiro` |

#### Administrativo - RH/DP (Sub-hub)
| key | label | path | parent_key |
|-----|-------|------|------------|
| `admin_rh_dp_hub` | RH/DP | `/administrativo/rh-dp` | `administrativo_hub` |
| `admin_rh_dp_colaboradores` | Colaboradores | `/administrativo/rh-dp/colaboradores` | `admin_rh_dp_hub` |

#### Administrativo - Compras (Sub-hub)
| key | label | path | parent_key |
|-----|-------|------|------------|
| `admin_compras_hub` | Compras & Suprimentos | `/administrativo/compras` | `administrativo_hub` |
| `admin_compras_estoque` | Estoque | `/administrativo/compras/estoque` | `admin_compras_hub` |
| `admin_compras_requisicoes` | Requisições | `/administrativo/compras/requisicoes` | `admin_compras_hub` |
| `admin_compras_fornecedores` | Fornecedores | `/administrativo/compras/fornecedores` | `admin_compras_hub` |

#### Administrativo - Fiscal (Sub-hub)
| key | label | path | parent_key |
|-----|-------|------|------------|
| `admin_fiscal_hub` | Fiscal & Contábil | `/administrativo/fiscal` | `administrativo_hub` |
| `admin_fiscal_notas` | Notas Fiscais | `/administrativo/fiscal/notas-fiscais` | `admin_fiscal_hub` |
| `admin_fiscal_emitir_nfe` | Emitir NF-e | `/administrativo/fiscal/notas-fiscais/emitir-nfe` | `admin_fiscal_notas` |
| `admin_fiscal_emitir_nfse` | Emitir NFS-e | `/administrativo/fiscal/notas-fiscais/emitir-nfse` | `admin_fiscal_notas` |
| `admin_fiscal_configuracoes` | Configurações Fiscais | `/administrativo/fiscal/configuracoes` | `admin_fiscal_hub` |

---

### Implementação

#### 1. Migration SQL

Criar uma migration que insere todas as rotas faltantes:

```sql
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
```

---

### Estrutura Hierárquica Final

Após a migration, a árvore de rotas no painel de permissões ficará organizada assim:

```text
Padrão
├── Home (acesso universal)
├── Vendas
│   ├── Minhas Vendas
│   ├── Meus Clientes
│   ├── Meus Orçamentos
│   ├── Meus Parceiros
│   ├── Catálogo          ← NOVA
│   └── Acompanhar Pedido ← NOVA
├── Fábrica
│   └── (rotas existentes)
├── Direção
│   ├── Vendas
│   ├── Faturamento
│   ├── Gestão Fábrica
│   ├── Gestão Instalação
│   │   └── Ordens de Instalações ← NOVA
│   └── Metas
│       └── Metas Fábrica         ← NOVA
├── Logística
│   ├── (rotas existentes)
│   └── Frete ← NOVA
├── Administrativo
│   ├── Pedidos
│   ├── Financeiro
│   │   ├── Faturamento
│   │   ├── Custos
│   │   ├── Cobranças ← NOVA
│   │   └── Caixa
│   ├── RH/DP ← NOVO
│   │   └── Colaboradores
│   ├── Compras & Suprimentos ← NOVO
│   │   ├── Estoque
│   │   ├── Requisições
│   │   └── Fornecedores
│   ├── Fiscal & Contábil ← NOVO
│   │   ├── Notas Fiscais
│   │   │   ├── Emitir NF-e
│   │   │   └── Emitir NFS-e
│   │   └── Configurações Fiscais
│   └── Documentos ← NOVA
└── Marketing
    └── (rotas existentes)
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/XXXXXX_add_missing_routes.sql` | Criar migration com INSERT das 18 rotas |

---

### Resultado Esperado

Após executar a migration:
- Todas as 18 rotas aparecerão no painel `/admin/permissions`
- A hierarquia será exibida corretamente com as pastas aninhadas
- Os administradores poderão gerenciar permissões granulares para cada nova rota
