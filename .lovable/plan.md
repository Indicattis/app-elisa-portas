
# Plano: Sidebar Lateral Esquerda com Pedidos no Cronograma

## Objetivo
Criar uma sidebar lateral esquerda recolhivel em `/fabrica/cronograma-producao` que exiba pedidos organizados por etapas em abas, permitindo filtrar as ordens de producao ao clicar em um pedido.

## Estrutura Proposta

```text
+------------+--------------------------------------------------+
|  SIDEBAR   |            AREA DE COLUNAS                       |
|  (260px)   |                                                  |
|------------|                                                  |
| [<] Pedidos|  [Perfiladeira] [Solda] [Separacao] [Qual] [Pint]|
|            |                                                  |
| [Tabs]     |     Card Cliente A                               |
| Producao|32|     Card Cliente B                               |
| Qualidade|8|     ...                                          |
| Pintura|12 |                                                  |
|            |                                                  |
| Filtro ativo:|                                                |
| Cliente X  |                                                  |
| [Limpar]   |                                                  |
|            |                                                  |
| Lista:     |                                                  |
| > PED-001  |                                                  |
|   Cliente X|                                                  |
| > PED-002  |                                                  |
|   Cliente Y|                                                  |
+------------+--------------------------------------------------+
```

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/cronograma/CronogramaSidebar.tsx` | CRIAR | Componente da sidebar com tabs e lista de pedidos |
| `src/components/cronograma/PedidoSidebarItem.tsx` | CRIAR | Item de pedido na sidebar |
| `src/pages/fabrica/CronogramaProducao.tsx` | MODIFICAR | Integrar sidebar e estado de filtro |
| `src/components/cronograma/ColunaOrdensProducao.tsx` | MODIFICAR | Receber prop para desabilitar drag |

## Detalhes Tecnicos

### 1. Estado do Filtro (`CronogramaProducao.tsx`)

```typescript
// Novo estado para controlar a sidebar
const [sidebarAberta, setSidebarAberta] = useState(true);
const [pedidoFiltrado, setPedidoFiltrado] = useState<string | null>(null);

// Filtrar ordens por pedido_id quando filtro ativo
const filtrarOrdens = (ordens: OrdemProducaoSimples[]) => {
  if (!pedidoFiltrado) return ordens;
  return ordens.filter(o => o.pedido_id === pedidoFiltrado);
};

// Determinar se drag esta habilitado
const isDragDisabled = !!pedidoFiltrado;
```

### 2. Novo Componente: `CronogramaSidebar.tsx`

```typescript
interface CronogramaSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoFiltrado: string | null;
  onPedidoClick: (pedidoId: string | null) => void;
}

// Usar hook existente usePedidosEtapas para cada aba
// Abas: em_producao, inspecao_qualidade, aguardando_pintura
```

Etapas a exibir nas abas da sidebar:
- **Em Producao** (em_producao)
- **Qualidade** (inspecao_qualidade)  
- **Pintura** (aguardando_pintura)

Cada aba mostra pedidos ordenados por `prioridade_etapa DESC`.

### 3. Estrutura do Item de Pedido (`PedidoSidebarItem.tsx`)

```typescript
interface PedidoSidebarItemProps {
  pedido: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    prioridade_etapa: number;
    tipo_entrega?: string;
  };
  isSelected: boolean;
  onClick: () => void;
}
```

Layout do item (40px altura):
```text
+----------------------------------------+
| [posicao] PED-001 | Cliente Tru... | ● |
+----------------------------------------+
```

### 4. Desabilitar Drag quando Filtrado

Em `ColunaOrdensProducao.tsx`:

```typescript
interface ColunaOrdensProducaoProps {
  // ... props existentes
  isDragDisabled?: boolean;  // NOVO
}

// Condicionar SortableContext
{isDragDisabled ? (
  <div className="flex flex-col gap-1.5">
    {ordens.map(...)}  // Sem sortable wrapper
  </div>
) : (
  <SortableContext ...>
    ...
  </SortableContext>
)}
```

Em `OrdemProducaoCard.tsx`:

```typescript
interface OrdemProducaoCardProps {
  // ... props existentes
  isDragDisabled?: boolean;  // NOVO
}

// Ocultar grip handle quando disabled
{!isDragDisabled && (
  <button {...attributes} {...listeners}>
    <GripVertical />
  </button>
)}
```

### 5. Layout Geral (`CronogramaProducao.tsx`)

```tsx
<div className="min-h-screen bg-black flex flex-col">
  {/* Header */}
  ...
  
  {/* Main com Sidebar + Content */}
  <main className="flex-1 flex overflow-hidden">
    {/* Sidebar Esquerda */}
    <CronogramaSidebar
      open={sidebarAberta}
      onOpenChange={setSidebarAberta}
      pedidoFiltrado={pedidoFiltrado}
      onPedidoClick={(id) => setPedidoFiltrado(pedidoFiltrado === id ? null : id)}
    />
    
    {/* Area Principal com Colunas */}
    <div className="flex-1 overflow-hidden">
      <DndContext
        sensors={pedidoFiltrado ? [] : sensors}  // Desabilita sensores quando filtrado
        ...
      >
        ...
      </DndContext>
    </div>
  </main>
</div>
```

### 6. Botao de Recolher Sidebar

Usar um botao com `ChevronLeft/ChevronRight` no header da sidebar:

```tsx
<button onClick={() => onOpenChange(!open)}>
  {open ? <PanelLeftClose /> : <PanelLeft />}
</button>
```

Quando recolhida: mostrar apenas uma barra fina com icone para expandir.

## Fluxo de Uso

1. Usuario abre `/fabrica/cronograma-producao`
2. Sidebar esquerda exibe pedidos da aba "Em Producao" por padrao
3. Usuario pode alternar entre abas (Producao, Qualidade, Pintura)
4. Ao clicar em um pedido:
   - Pedido fica destacado (selecionado)
   - Colunas filtram ordens para mostrar apenas daquele pedido
   - Grip handles de arrastar desaparecem
   - Header mostra badge "Filtrado: Cliente X" com botao limpar
5. Ao clicar novamente no mesmo pedido ou no "X", filtro e limpo
6. Usuario pode recolher sidebar clicando no botao de toggle

## Dados Utilizados

- `usePedidosEtapas(etapa)` para buscar pedidos por etapa
- Pedidos ja vem ordenados por `prioridade_etapa DESC`
- Ordens possuem `pedido_id` para filtrar

## Responsividade

- Em telas pequenas (mobile): sidebar vira um Sheet deslizante
- Trigger para abrir sidebar fica no header
