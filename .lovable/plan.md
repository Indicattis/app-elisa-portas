
# Plano: Criar Setor de Estoque em /home - ✅ CONCLUÍDO

## Resumo

Novo setor "Estoque" adicionado na tela Home (/home) com hub centralizado e 3 sub-rotas implementadas.

---

## Estrutura do Novo Setor

```text
/estoque (Hub)
├── /estoque/fabrica        -> Gerencia itens de produção (tabela estoque existente)
├── /estoque/almoxarifado   -> Gerencia insumos (nova tabela)
└── /estoque/fornecedores   -> Gerencia fornecedores (tabela fornecedores existente)
```

---

## 1. Banco de Dados

### Nova Tabela: `almoxarifado`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| nome | text | Nome do insumo |
| fornecedor_id | uuid | FK para fornecedores |
| quantidade_minima | numeric | Estoque mínimo |
| quantidade_maxima | numeric | Estoque máximo |
| quantidade_estoque | numeric | Quantidade atual |
| data_ultima_conferencia | date | Data da última verificação |
| custo | numeric | Custo unitário |
| unidade | text | Un., Kg, Metro, etc. |
| ativo | boolean | Soft delete |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |
| created_by | uuid | Usuário que criou |

**Campo calculado**: `total_estoque` = custo x quantidade_estoque (calculado no frontend)

---

## 2. Alterações em Arquivos Existentes

### `src/pages/Home.tsx`

Adicionar item "Estoque" no array `menuItems` e no mapeamento `routeKeyMap`:

```typescript
// No routeKeyMap
'/estoque': 'estoque_hub',

// No menuItems (após Administrativo)
{ label: "Estoque", icon: Warehouse, path: "/estoque" }
```

### `src/App.tsx`

Adicionar imports e rotas:

```typescript
// Imports
import EstoqueHub from "./pages/estoque/EstoqueHub";
import EstoqueFabrica from "./pages/estoque/EstoqueFabrica";
import AlmoxarifadoPage from "./pages/estoque/AlmoxarifadoPage";
import EstoqueFornecedores from "./pages/estoque/EstoqueFornecedores";

// Rotas (após logística)
<Route path="/estoque" element={<ProtectedRoute routeKey="estoque_hub"><EstoqueHub /></ProtectedRoute>} />
<Route path="/estoque/fabrica" element={<ProtectedRoute routeKey="estoque_fabrica"><EstoqueFabrica /></ProtectedRoute>} />
<Route path="/estoque/almoxarifado" element={<ProtectedRoute routeKey="estoque_almoxarifado"><AlmoxarifadoPage /></ProtectedRoute>} />
<Route path="/estoque/fornecedores" element={<ProtectedRoute routeKey="estoque_fornecedores"><EstoqueFornecedores /></ProtectedRoute>} />
```

---

## 3. Novos Arquivos

### `src/pages/estoque/EstoqueHub.tsx`

Hub central do setor Estoque (seguindo padrão do ComprasHub):
- 3 botões: Fábrica, Almoxarifado, Fornecedores
- Layout responsivo (mobile: lista vertical, desktop: grid 3 colunas)
- Estilo minimalista com gradiente azul

### `src/pages/estoque/EstoqueFabrica.tsx`

Clone da página `EstoqueMinimalista.tsx` com ajustes:
- Breadcrumb: Home > Estoque > Fábrica
- BackPath: /estoque
- Mesma tabela `estoque` do banco de dados
- Exibe colunas simplificadas: SKU, Produto, Categoria, Setor, Pintura

### `src/hooks/useAlmoxarifado.ts`

Hook para gerenciar a tabela almoxarifado:
- CRUD completo (listar, criar, atualizar, excluir)
- Cálculo do total em estoque (custo x quantidade)

### `src/pages/estoque/AlmoxarifadoPage.tsx`

Nova página para gerenciar insumos:
- Tabela com colunas: Nome, Fornecedor, Qtd. Mín., Qtd. Máx., Em Estoque, Última Conf., Custo, Un., Total
- Modal de criação/edição com todos os campos
- Select de fornecedores (usando useFornecedores)
- Indicador visual quando estoque < mínimo (vermelho) ou > máximo (amarelo)

### `src/pages/estoque/EstoqueFornecedores.tsx`

Clone de `FornecedoresMinimalista.tsx` com ajustes:
- Breadcrumb: Home > Estoque > Fornecedores
- BackPath: /estoque

---

## 4. Permissões (app_routes)

Inserir registros na tabela `app_routes`:

| key | label | path | parent_key |
|-----|-------|------|------------|
| estoque_hub | Estoque | /estoque | null |
| estoque_fabrica | Fábrica | /estoque/fabrica | estoque_hub |
| estoque_almoxarifado | Almoxarifado | /estoque/almoxarifado | estoque_hub |
| estoque_fornecedores | Fornecedores | /estoque/fornecedores | estoque_hub |

---

## 5. RLS Policies

Criar policies para a nova tabela `almoxarifado`:
- SELECT: Usuários autenticados podem ler
- INSERT/UPDATE/DELETE: Usuários com acesso à rota `estoque_almoxarifado`

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/Home.tsx` |
| Editar | `src/App.tsx` |
| Criar | `src/pages/estoque/EstoqueHub.tsx` |
| Criar | `src/pages/estoque/EstoqueFabrica.tsx` |
| Criar | `src/pages/estoque/AlmoxarifadoPage.tsx` |
| Criar | `src/pages/estoque/EstoqueFornecedores.tsx` |
| Criar | `src/hooks/useAlmoxarifado.ts` |

---

## Resultado Visual

### Home (/home)

```text
[Direção]  [Marketing]  [Vendas]
[Fábrica]  [Logística]  [Administrativo]
[Estoque]  <- NOVO
```

### Hub de Estoque (/estoque)

```text
Desktop:
┌─────────────┐ ┌───────────────┐ ┌───────────────┐
│   Fábrica   │ │  Almoxarifado │ │  Fornecedores │
└─────────────┘ └───────────────┘ └───────────────┘

Mobile:
[Fábrica]
[Almoxarifado]
[Fornecedores]
```
