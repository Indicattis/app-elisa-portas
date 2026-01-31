

# Plano: Mover Estoque para /direcao/estoque

## Resumo da Mudanca

Mover o setor de Estoque de `/estoque` para `/direcao/estoque`, transformando-o em um modulo de gestao gerencial com foco em auditoria e configuracoes.

## Estrutura Nova

```
/direcao/estoque (Hub)
├── Auditoria Fabrica      -> /direcao/estoque/auditoria/fabrica
├── Auditoria Almoxarifado -> /direcao/estoque/auditoria/almoxarifado
└── Configuracoes          -> /direcao/estoque/configuracoes
```

## Alteracoes Necessarias

### 1. Banco de Dados

Adicionar coluna `setor` na tabela `estoque_conferencias` para distinguir origem:

```sql
ALTER TABLE estoque_conferencias 
ADD COLUMN setor TEXT DEFAULT 'fabrica';
```

### 2. Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/direcao/estoque/DirecaoEstoqueHub.tsx` | Hub principal com 3 botoes |
| `src/pages/direcao/estoque/AuditoriaFabrica.tsx` | Lista conferencias da fabrica |
| `src/pages/direcao/estoque/AuditoriaAlmoxarifado.tsx` | Lista conferencias do almoxarifado |
| `src/pages/direcao/estoque/ConfiguracoesEstoque.tsx` | Acesso a produtos e fornecedores |

### 3. Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Home.tsx` | Remover botao Estoque |
| `src/pages/direcao/DirecaoHub.tsx` | Adicionar botao Estoque |
| `src/App.tsx` | Adicionar novas rotas em /direcao/estoque |
| `src/hooks/useConferenciaEstoque.ts` | Adicionar filtro por setor |

### 4. Design do Hub DirecaoEstoqueHub

Layout minimalista com 3 botoes azuis:

```
┌───────────────────────────────────────────────────┐
│  [←]                      Home > Direcao > Estoque│
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🔍 Auditoria Fabrica                        │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🔍 Auditoria Almoxarifado                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ ⚙️ Configuracoes                            │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 5. Pagina de Configuracoes

Hub secundario com 2 opcoes:

```
┌───────────────────────────────────────────────────┐
│  [←]               Home > Direcao > Estoque > Config │
│                                                   │
│  ┌───────────────────┐  ┌───────────────────┐    │
│  │  Produtos         │  │  Fornecedores     │    │
│  │  Cadastro de      │  │  Gestao de        │    │
│  │  produtos         │  │  fornecedores     │    │
│  └───────────────────┘  └───────────────────┘    │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 6. Fluxo de Rotas

**Antes:**
```
/home -> /estoque -> /estoque/auditoria
                  -> /estoque/fabrica
                  -> /estoque/almoxarifado
                  -> /estoque/fornecedores
```

**Depois:**
```
/home -> /direcao -> /direcao/estoque -> /direcao/estoque/auditoria/fabrica
                                      -> /direcao/estoque/auditoria/almoxarifado
                                      -> /direcao/estoque/configuracoes
                                           -> /direcao/estoque/configuracoes/produtos
                                           -> /direcao/estoque/configuracoes/fornecedores
```

### 7. Detalhes Tecnicos

**Hook useConferenciaEstoque - Filtro por Setor:**
```typescript
// Adicionar parametro setor nas queries
const { data: conferenciasConcluidas } = useQuery({
  queryKey: ["conferencias-concluidas", setor],
  queryFn: async () => {
    let query = supabase
      .from("estoque_conferencias")
      .select("*")
      .eq("status", "concluida")
      .order("concluida_em", { ascending: false });
    
    if (setor) {
      query = query.eq("setor", setor);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
});
```

**DirecaoHub - Adicionar Botao:**
```typescript
const menuItems = [
  // ... botoes existentes
  { label: 'Estoque', icon: Warehouse, path: '/direcao/estoque' }, // NOVO
];
```

**Home.tsx - Remover Botao:**
```typescript
const menuItems = [
  { label: "Direcao", icon: Shield, path: "/direcao", isGold: true },
  { label: "Marketing", icon: BarChart3, path: "/marketing" },
  { label: "Vendas", icon: ShoppingCart, path: "/vendas" },
  { label: "Fabrica", icon: Factory, path: "/fabrica" },
  { label: "Logistica", icon: Truck, path: "/logistica" },
  // REMOVIDO: { label: "Estoque", icon: Warehouse, path: "/estoque" },
  { label: "Administrativo", icon: Building2, path: "/administrativo" }
];
```

### 8. App.tsx - Novas Rotas

```typescript
// Hub Direcao Estoque
import DirecaoEstoqueHub from "./pages/direcao/estoque/DirecaoEstoqueHub";
import AuditoriaFabrica from "./pages/direcao/estoque/AuditoriaFabrica";
import AuditoriaAlmoxarifado from "./pages/direcao/estoque/AuditoriaAlmoxarifado";
import ConfiguracoesEstoque from "./pages/direcao/estoque/ConfiguracoesEstoque";

// Rotas
<Route path="/direcao/estoque" element={<ProtectedRoute routeKey="direcao_hub"><DirecaoEstoqueHub /></ProtectedRoute>} />
<Route path="/direcao/estoque/auditoria/fabrica" element={<ProtectedRoute routeKey="direcao_hub"><AuditoriaFabrica /></ProtectedRoute>} />
<Route path="/direcao/estoque/auditoria/almoxarifado" element={<ProtectedRoute routeKey="direcao_hub"><AuditoriaAlmoxarifado /></ProtectedRoute>} />
<Route path="/direcao/estoque/configuracoes" element={<ProtectedRoute routeKey="direcao_hub"><ConfiguracoesEstoque /></ProtectedRoute>} />
<Route path="/direcao/estoque/configuracoes/produtos" element={<ProtectedRoute routeKey="direcao_hub"><EstoqueFabrica /></ProtectedRoute>} />
<Route path="/direcao/estoque/configuracoes/fornecedores" element={<ProtectedRoute routeKey="direcao_hub"><EstoqueFornecedores /></ProtectedRoute>} />
```

### 9. Rotas Antigas

As rotas antigas em `/estoque/*` serao mantidas temporariamente para nao quebrar referencias existentes (producao usa `/estoque/conferencia`), mas o botao no /home sera removido.

## Resultado Esperado

1. Botao "Estoque" removido do /home
2. Botao "Estoque" adicionado no /direcao
3. Hub em /direcao/estoque com 3 opcoes
4. Auditorias separadas por setor (fabrica/almoxarifado)
5. Pagina de configuracoes com acesso a produtos e fornecedores

