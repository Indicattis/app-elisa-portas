
## Plano: Adicionar Botao "Logs" em /admin e Criar Pagina /admin/logs

### Visao Geral

Adicionar um botao "Logs" no hub de administracao (/admin) que encaminha para uma nova pagina /admin/logs. Esta pagina exibira logs consolidados do sistema a partir de varias tabelas existentes:

- `pedidos_movimentacoes` - Movimentacoes de pedidos de producao
- `estoque_movimentacoes` - Movimentacoes de estoque
- `tarefas_historico` - Historico de tarefas concluidas

### Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `src/pages/admin/AdminHub.tsx` | Adicionar item "Logs" no menuItems |
| `src/pages/admin/AdminLogs.tsx` | Criar nova pagina de logs |
| `src/App.tsx` | Adicionar rota /admin/logs |

### Parte 1: Adicionar Botao no Hub

Modificar o array `menuItems` em `AdminHub.tsx`:

```typescript
import { Shield, Briefcase, Building2, Users, LogOut, LayoutDashboard, Tv, ArrowLeft, FileText } from "lucide-react";

const menuItems = [
  { label: "Permissões", icon: Shield, path: "/admin/permissions" },
  { label: "Cargos", icon: Briefcase, path: "/admin/roles" },
  { label: "Empresas", icon: Building2, path: "/admin/companies" },
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Logs", icon: FileText, path: "/admin/logs" },  // NOVO
];
```

### Parte 2: Criar Pagina AdminLogs

Nova pagina seguindo o padrao MinimalistLayout:

```text
/src/pages/admin/AdminLogs.tsx

Funcionalidades:
- Filtro por tipo de log (Pedidos, Estoque, Tarefas)
- Filtro por data (ultimos 7 dias, 30 dias, etc.)
- Busca por texto
- Lista com scroll infinito ou paginacao
- Exibicao formatada de cada tipo de log
```

Estrutura visual:
- Header com titulo "Logs do Sistema" e breadcrumb
- Filtros em card com glassmorphism
- Lista de logs com icones diferenciados por tipo
- Cada log mostra: data/hora, tipo, descricao, usuario responsavel

### Parte 3: Adicionar Rota

Em `App.tsx`, adicionar apos a rota /admin/users:

```typescript
<Route
  path="/admin/logs"
  element={
    <ProtectedRoute routeKey="admin_logs">
      <AdminLogs />
    </ProtectedRoute>
  }
/>
```

### Parte 4: Adicionar Rota no Banco (Permissoes)

Criar entrada na tabela `app_routes` para controle de acesso:

```sql
INSERT INTO app_routes (key, label, path, interface, parent_key, ordem)
VALUES ('admin_logs', 'Logs do Sistema', '/admin/logs', 'admin', 'admin', 50);
```

### Design da Pagina de Logs

```text
+----------------------------------------------------------+
|  <- Voltar     Logs do Sistema                           |
|                Historico de acoes do sistema             |
+----------------------------------------------------------+
|  [Buscar...]  [Tipo: Todos v]  [Periodo: 7 dias v]       |
|                                                          |
|  Mostrando 156 logs                                      |
+----------------------------------------------------------+
|  [icone] Pedido 0092 - Avancou para inspecao_qualidade   |
|  26/01/2026 15:10  por  Maria Silva                      |
+----------------------------------------------------------+
|  [icone] Estoque - Saida de 10 unidades de Fechadura     |
|  26/01/2026 14:30  por  Joao Santos                      |
+----------------------------------------------------------+
|  ...                                                     |
+----------------------------------------------------------+
```

### Resultado Esperado

1. Botao "Logs" aparece no grid do /admin (posicao 5)
2. Clique navega para /admin/logs
3. Pagina exibe logs consolidados de varias fontes
4. Filtros permitem buscar logs especificos
5. Controle de acesso via permissoes (routeKey: admin_logs)
