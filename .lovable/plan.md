

# Plano: Corrigir Rotas e Breadcrumbs do Estoque na Direcao

## Problemas Identificados

1. **Navegacao de Produtos sem Hub**: Ao clicar em "Produtos" em `/direcao/estoque/configuracoes`, vai direto para `EstoqueFabrica` em vez de um hub para escolher entre Fabrica e Almoxarifado
2. **Breadcrumbs incorretos**: `EstoqueFabrica`, `AlmoxarifadoPage` e `EstoqueFornecedores` apontam para `/estoque` nos breadcrumbs e botao de voltar
3. **Rotas de edicao faltando**: Quando edita um produto, navega para `/estoque/fabrica/editar-item/:id` em vez da rota correta

## Solucao

### 1. Criar Hub de Produtos

**Novo arquivo:** `src/pages/direcao/estoque/ProdutosHub.tsx`

```text
┌───────────────────────────────────────────────────┐
│  [←]      Home > Direcao > Estoque > Config > Prod│
│                                                   │
│           📦 Produtos                             │
│         Escolha o tipo de produto                 │
│                                                   │
│  ┌───────────────────┐  ┌───────────────────┐    │
│  │  🏭 Fabrica       │  │  📦 Almoxarifado  │    │
│  │  Insumos de       │  │  Insumos de       │    │
│  │  producao         │  │  apoio            │    │
│  └───────────────────┘  └───────────────────┘    │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 2. Criar Paginas de Produtos da Direcao

Criar wrappers que reutilizam os componentes existentes mas com breadcrumbs corretos:

| Arquivo Novo | Funcao |
|--------------|--------|
| `src/pages/direcao/estoque/ProdutosFabrica.tsx` | Wrapper de EstoqueFabrica com paths corretos |
| `src/pages/direcao/estoque/ProdutosAlmoxarifado.tsx` | Wrapper de AlmoxarifadoPage com paths corretos |
| `src/pages/direcao/estoque/ProdutosFabricaEdit.tsx` | Wrapper de EstoqueFabricaEdit com paths corretos |
| `src/pages/direcao/estoque/FornecedoresDirecao.tsx` | Wrapper de EstoqueFornecedores com paths corretos |

### 3. Atualizar ConfiguracoesEstoque

Mudar o path de "Produtos" para ir ao hub:

```typescript
const menuItems = [
  { 
    label: 'Produtos', 
    icon: Package, 
    path: '/direcao/estoque/configuracoes/produtos', // Vai para o hub
    description: 'Cadastro de produtos' 
  },
  { 
    label: 'Fornecedores', 
    icon: Truck, 
    path: '/direcao/estoque/configuracoes/fornecedores', 
    description: 'Gestao de fornecedores' 
  },
];
```

### 4. Atualizar App.tsx - Novas Rotas

```typescript
// Importar novos componentes
import ProdutosHub from "./pages/direcao/estoque/ProdutosHub";
import ProdutosFabrica from "./pages/direcao/estoque/ProdutosFabrica";
import ProdutosAlmoxarifado from "./pages/direcao/estoque/ProdutosAlmoxarifado";
import ProdutosFabricaEdit from "./pages/direcao/estoque/ProdutosFabricaEdit";
import FornecedoresDirecao from "./pages/direcao/estoque/FornecedoresDirecao";

// Rotas atualizadas
<Route path="/direcao/estoque/configuracoes/produtos" element={<ProtectedRoute routeKey="direcao_hub"><ProdutosHub /></ProtectedRoute>} />
<Route path="/direcao/estoque/configuracoes/produtos/fabrica" element={<ProtectedRoute routeKey="direcao_hub"><ProdutosFabrica /></ProtectedRoute>} />
<Route path="/direcao/estoque/configuracoes/produtos/fabrica/editar/:id" element={<ProtectedRoute routeKey="direcao_hub"><ProdutosFabricaEdit /></ProtectedRoute>} />
<Route path="/direcao/estoque/configuracoes/produtos/almoxarifado" element={<ProtectedRoute routeKey="direcao_hub"><ProdutosAlmoxarifado /></ProtectedRoute>} />
<Route path="/direcao/estoque/configuracoes/fornecedores" element={<ProtectedRoute routeKey="direcao_hub"><FornecedoresDirecao /></ProtectedRoute>} />
```

### 5. Estrutura de Navegacao Corrigida

```text
/direcao/estoque (Hub)
├── Auditoria Fabrica      -> /direcao/estoque/auditoria/fabrica
├── Auditoria Almoxarifado -> /direcao/estoque/auditoria/almoxarifado
└── Configuracoes          -> /direcao/estoque/configuracoes
    ├── Produtos           -> /direcao/estoque/configuracoes/produtos (HUB)
    │   ├── Fabrica        -> /direcao/estoque/configuracoes/produtos/fabrica
    │   │   └── Editar     -> /direcao/estoque/configuracoes/produtos/fabrica/editar/:id
    │   └── Almoxarifado   -> /direcao/estoque/configuracoes/produtos/almoxarifado
    └── Fornecedores       -> /direcao/estoque/configuracoes/fornecedores
```

### 6. Breadcrumbs Corretos

**ProdutosFabrica:**
```typescript
const breadcrumbItems = [
  { label: 'Home', path: '/home' },
  { label: 'Direcao', path: '/direcao' },
  { label: 'Estoque', path: '/direcao/estoque' },
  { label: 'Configuracoes', path: '/direcao/estoque/configuracoes' },
  { label: 'Produtos', path: '/direcao/estoque/configuracoes/produtos' },
  { label: 'Fabrica' }
];
// backPath: '/direcao/estoque/configuracoes/produtos'
```

**FornecedoresDirecao:**
```typescript
const breadcrumbItems = [
  { label: 'Home', path: '/home' },
  { label: 'Direcao', path: '/direcao' },
  { label: 'Estoque', path: '/direcao/estoque' },
  { label: 'Configuracoes', path: '/direcao/estoque/configuracoes' },
  { label: 'Fornecedores' }
];
// backPath: '/direcao/estoque/configuracoes'
```

### 7. Atualizar Permissoes (app_routes)

Executar SQL para adicionar novas rotas ao sistema de permissoes:

```sql
-- Hub de Produtos na Direcao
INSERT INTO app_routes (key, label, path, interface, parent_key, sort_order, active)
VALUES 
  ('direcao_estoque_hub', 'Estoque', '/direcao/estoque', 'padrao', 'direcao_hub', 90, true),
  ('direcao_estoque_config', 'Configuracoes', '/direcao/estoque/configuracoes', 'padrao', 'direcao_estoque_hub', 91, true),
  ('direcao_estoque_produtos', 'Produtos', '/direcao/estoque/configuracoes/produtos', 'padrao', 'direcao_estoque_config', 92, true),
  ('direcao_estoque_fornecedores', 'Fornecedores', '/direcao/estoque/configuracoes/fornecedores', 'padrao', 'direcao_estoque_config', 93, true),
  ('direcao_estoque_auditoria_fab', 'Auditoria Fabrica', '/direcao/estoque/auditoria/fabrica', 'padrao', 'direcao_estoque_hub', 94, true),
  ('direcao_estoque_auditoria_alm', 'Auditoria Almoxarifado', '/direcao/estoque/auditoria/almoxarifado', 'padrao', 'direcao_estoque_hub', 95, true)
ON CONFLICT (key) DO NOTHING;
```

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/direcao/estoque/ProdutosHub.tsx` | Hub para escolher Fabrica ou Almoxarifado |
| `src/pages/direcao/estoque/ProdutosFabrica.tsx` | Lista de produtos da fabrica |
| `src/pages/direcao/estoque/ProdutosAlmoxarifado.tsx` | Lista de produtos do almoxarifado |
| `src/pages/direcao/estoque/ProdutosFabricaEdit.tsx` | Edicao de produto da fabrica |
| `src/pages/direcao/estoque/FornecedoresDirecao.tsx` | Lista de fornecedores |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Atualizar rotas do estoque na direcao |
| `src/pages/direcao/estoque/ConfiguracoesEstoque.tsx` | Path de produtos ja aponta corretamente |

## Resultado Esperado

1. Clicar em "Produtos" em `/direcao/estoque/configuracoes` abre hub com opcoes Fabrica e Almoxarifado
2. Botao voltar e breadcrumbs navegam corretamente dentro da hierarquia `/direcao/estoque/...`
3. Edicao de produto navega para `/direcao/estoque/configuracoes/produtos/fabrica/editar/:id`
4. Novas rotas visiveis em `/admin/permissions` para controle de acesso

