
## Plano: Criar pagina "Ordens por Pedido" em /fabrica/ordens-pedidos

### Visao Geral

Adicionar um botao "Ordens por Pedido" no hub /fabrica que encaminha para uma nova pagina /fabrica/ordens-pedidos. Esta pagina exibira os pedidos em formato de "pasta" (colapsavel) organizados por etapas (abas), similar ao /fabrica/pedidos-producao. Ao expandir um pedido, o usuario vera as ordens de producao associadas (soldagem, perfiladeira, separacao, qualidade, pintura). Ao clicar em uma ordem, uma sidebar (Sheet) abrira mostrando as linhas da ordem para serem concluidas.

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/fabrica/FabricaHub.tsx` | Adicionar item "Ordens por Pedido" no menuItems |
| `src/pages/fabrica/OrdensPorPedido.tsx` | Criar nova pagina |
| `src/hooks/useOrdensPorPedido.ts` | Criar hook para buscar pedidos com ordens consolidadas |
| `src/components/fabrica/PedidoOrdemCard.tsx` | Criar card colapsavel do pedido com ordens |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Criar sidebar para exibir linhas da ordem |
| `src/App.tsx` | Adicionar rota /fabrica/ordens-pedidos |

---

### Parte 1: Adicionar Botao no Hub

Modificar o array `menuItems` em `FabricaHub.tsx`:

```typescript
import { Package, Boxes, Factory, ArrowLeft, Lock, ClipboardList } from "lucide-react";

const menuItems = [
  { label: 'Gestão de Pedidos', icon: Package, path: '/fabrica/pedidos-producao' },
  { label: 'Ordens por Pedido', icon: ClipboardList, path: '/fabrica/ordens-pedidos' },  // NOVO
  { label: 'Controle de Estoque', icon: Boxes, path: '/fabrica/controle-estoque' },
  { label: 'Produção', icon: Factory, path: '/fabrica/producao' },
];

const routeKeyMap: Record<string, string> = {
  '/fabrica/pedidos-producao': 'fabrica_pedidos',
  '/fabrica/ordens-pedidos': 'fabrica_ordens_pedidos',  // NOVO
  '/fabrica/controle-estoque': 'fabrica_estoque',
  '/fabrica/producao': 'fabrica_producao',
};
```

---

### Parte 2: Criar Hook useOrdensPorPedido

O hook buscara pedidos de producao por etapa e consolidara as ordens de cada setor em um unico objeto.

```typescript
// src/hooks/useOrdensPorPedido.ts

interface OrdemStatus {
  existe: boolean;
  id: string | null;
  numero_ordem: string | null;
  status: string | null;
  tipo: 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';
}

interface PedidoComOrdens {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  etapa_atual: string;
  ordens: {
    soldagem: OrdemStatus;
    perfiladeira: OrdemStatus;
    separacao: OrdemStatus;
    qualidade: OrdemStatus;
    pintura: OrdemStatus;
  };
}

// Buscar pedidos de uma etapa e suas ordens consolidadas
```

Fluxo de busca:
1. Buscar pedidos_producao por etapa
2. Para cada pedido, buscar ordens em paralelo de cada tabela (ordens_soldagem, ordens_perfiladeira, etc.)
3. Consolidar em objeto PedidoComOrdens

---

### Parte 3: Criar Pagina OrdensPorPedido.tsx

A pagina seguira o padrao MinimalistLayout e tera:

1. **Tabs por Etapa**: Similar ao PedidosProducaoMinimalista (aberto, em_producao, inspecao_qualidade, etc.)
2. **Lista de Pedidos Colapsaveis**: Cada pedido e uma "pasta" que pode ser expandida
3. **Ao Expandir**: Mostra badges das ordens existentes (Soldagem, Perfiladeira, etc.)
4. **Ao Clicar na Ordem**: Abre Sheet lateral com as linhas da ordem

```text
+------------------------------------------------------------+
|  <- Voltar     Ordens por Pedido                           |
|                Visualize as ordens de cada pedido          |
+------------------------------------------------------------+
|  [Aberto] [Em Produção] [Inspeção] [Pintura] [Coleta]      |
+------------------------------------------------------------+
|  [v] Pedido #0157 - Cliente XPTO                           |
|      +------------------------------------------------+    |
|      | [Soldagem] pendente  [Perfiladeira] concluido |    |
|      | [Separação] pendente  [Qualidade] -           |    |
|      +------------------------------------------------+    |
|                                                            |
|  [>] Pedido #0158 - Cliente ABC                            |
|                                                            |
|  [>] Pedido #0159 - Cliente DEF                            |
+------------------------------------------------------------+
```

---

### Parte 4: Criar Componente PedidoOrdemCard

Componente colapsavel usando Radix Collapsible:

```typescript
// src/components/fabrica/PedidoOrdemCard.tsx

interface PedidoOrdemCardProps {
  pedido: PedidoComOrdens;
  onOrdemClick: (ordem: OrdemStatus) => void;
}

// Renderiza:
// - Header com numero do pedido e cliente (trigger)
// - Conteudo colapsavel com grid de badges das ordens
// - Cada badge e clicavel e abre o Sheet
```

Estilos dos badges por status:
- pendente: bg-yellow-500/20 text-yellow-300
- em_andamento: bg-blue-500/20 text-blue-300
- concluido: bg-green-500/20 text-green-300
- nao existe: bg-zinc-800/50 text-zinc-500 (desabilitado)

---

### Parte 5: Criar Componente OrdemLinhasSheet

Sidebar para exibir e interagir com as linhas da ordem:

```typescript
// src/components/fabrica/OrdemLinhasSheet.tsx

interface OrdemLinhasSheetProps {
  ordem: OrdemStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Utiliza useLinhasOrdem para buscar as linhas
// Renderiza:
// - Header com numero da ordem e tipo
// - Lista de linhas com checkbox de conclusao
// - Status de cada linha (pendente/concluida)
```

Reutilizara o hook existente `useLinhasOrdem` para buscar as linhas e permitira marcar linhas como concluidas utilizando logica similar ao `useOrdemProducao.marcarLinhaConcluida`.

---

### Parte 6: Adicionar Rota no App.tsx

```typescript
<Route
  path="/fabrica/ordens-pedidos"
  element={
    <ProtectedRoute routeKey="fabrica_ordens_pedidos">
      <OrdensPorPedido />
    </ProtectedRoute>
  }
/>
```

---

### Parte 7: Adicionar Rota no Banco (Permissoes)

Criar entrada na tabela `app_routes`:

```sql
INSERT INTO app_routes (key, label, path, interface, parent_key, sort_order, icon, active)
VALUES ('fabrica_ordens_pedidos', 'Ordens por Pedido', '/fabrica/ordens-pedidos', 'padrao', 'fabrica', 2, 'ClipboardList', true)
ON CONFLICT (key) DO NOTHING;
```

---

### Arquitetura de Dados

```text
pedidos_producao
    |
    +-- ordens_soldagem (1:1 ou nenhum)
    |       +-- linhas_ordens (1:N)
    |
    +-- ordens_perfiladeira (1:1 ou nenhum)
    |       +-- linhas_ordens (1:N)
    |
    +-- ordens_separacao (1:1 ou nenhum)
    |       +-- linhas_ordens (1:N)
    |
    +-- ordens_qualidade (1:1 ou nenhum)
    |       +-- linhas_ordens (1:N)
    |
    +-- ordens_pintura (1:1 ou nenhum)
            +-- linhas_ordens (1:N)
```

---

### Resumo das Mudancas

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `FabricaHub.tsx` | Modificar | Adicionar botao "Ordens por Pedido" |
| `OrdensPorPedido.tsx` | Criar | Nova pagina com tabs e lista colapsavel |
| `useOrdensPorPedido.ts` | Criar | Hook para buscar pedidos com ordens consolidadas |
| `PedidoOrdemCard.tsx` | Criar | Card colapsavel do pedido |
| `OrdemLinhasSheet.tsx` | Criar | Sidebar com linhas da ordem |
| `App.tsx` | Modificar | Adicionar rota |
| SQL Migration | Criar | Adicionar route no app_routes |

---

### Resultado Esperado

1. Botao "Ordens por Pedido" aparece no hub /fabrica (posicao 2)
2. Clique navega para /fabrica/ordens-pedidos
3. Pagina exibe pedidos organizados por etapa em tabs
4. Usuario pode expandir cada pedido para ver suas ordens
5. Usuario pode clicar em uma ordem para abrir sidebar com linhas
6. Linhas podem ser marcadas como concluidas diretamente na sidebar
7. Controle de acesso via permissoes (routeKey: fabrica_ordens_pedidos)
