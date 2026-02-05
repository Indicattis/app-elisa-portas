
# Plano: Cards Compactos de 45px com Sidebar de Detalhes

## Objetivo

1. Reduzir os cards de ordens para linhas de 45px de altura
2. Reorganizar elementos horizontalmente para caber no espaco compacto
3. Adicionar funcionalidade de clique para abrir a sidebar lateral direita

## Analise do Layout Atual vs Proposto

### Layout Atual (multi-linha, ~150px altura)
```
+-----------------------------------------------+
| (grip) [1] PERF-12345          [Pausada]      |
|        Cliente Nome . PED-001                 |
|        [Instalacao]                           |
|        (o)(o)(o) cores       12.5m² / 45.2m   |
|        [!] Motivo da pausa aqui...            |
|        [Disponivel]         [Avatar] Nome     |
+-----------------------------------------------+
```

### Layout Proposto (linha unica, 45px altura)
```
+-----------------------------------------------+
| (grip) [1] PERF-12345 | Cliente | (o)(o) | 12m² | [Disp] | [Av] |
+-----------------------------------------------+
```

Elementos a exibir na linha compacta:
- Grip handle para drag
- Posicao (badge circular)
- Numero da ordem (truncado)
- Cliente (truncado, maximo 15 chars)
- Cores (maximo 2 circulos + indicador +N)
- Metragem principal (m² ou m linear, a que existir)
- Status (badge compacto, apenas icone se pausada)
- Avatar do responsavel (ou icone vazio)

## Alteracoes Necessarias

### 1. Componente `OrdemProducaoCard.tsx`

**Novo layout horizontal compacto:**

```tsx
<div
  ref={setNodeRef}
  style={style}
  onClick={handleClick}
  className={cn(
    "h-[45px] bg-zinc-800/50 rounded-md border border-zinc-700/50 px-2",
    "flex items-center gap-2 cursor-pointer",
    "hover:bg-zinc-800 hover:border-zinc-600/50 transition-all",
    isDragging && "opacity-50 shadow-xl z-50"
  )}
>
  {/* Grip - apenas drag handle, nao propaga click */}
  <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
    <GripVertical className="h-4 w-4" />
  </button>

  {/* Posicao */}
  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
    {posicao}
  </span>

  {/* Numero ordem (truncado) */}
  <span className="text-xs font-medium text-white w-20 truncate">
    {ordem.numero_ordem}
  </span>

  {/* Cliente (truncado) */}
  <span className="text-[10px] text-zinc-400 w-24 truncate">
    {ordem.cliente_nome}
  </span>

  {/* Cores (max 2) */}
  <div className="flex gap-0.5">
    {ordem.cores?.slice(0,2).map(...)}
    {ordem.cores?.length > 2 && <span>+{ordem.cores.length-2}</span>}
  </div>

  {/* Metragem */}
  <span className="text-[10px] text-zinc-400">
    {ordem.metragem_quadrada || ordem.metragem_linear}m
  </span>

  {/* Status */}
  {ordem.pausada ? (
    <Pause className="h-3 w-3 text-amber-400" />
  ) : (
    <Badge className="text-[9px] px-1 py-0">{statusConfig.label}</Badge>
  )}

  {/* Avatar responsavel */}
  <Avatar className="h-5 w-5">...</Avatar>
</div>
```

**Novas props:**

```typescript
interface OrdemProducaoCardProps {
  ordem: OrdemProducaoSimples;
  posicao: number;
  tipo: TipoOrdemProducao;  // NOVO: necessario para a sidebar
  onOrdemClick: (ordem: OrdemProducaoSimples) => void;  // NOVO: callback
}
```

### 2. Componente `ColunaOrdensProducao.tsx`

**Adicionar prop de callback e repassar para cards:**

```typescript
interface ColunaOrdensProducaoProps {
  tipo: TipoOrdemProducao;
  titulo: string;
  ordens: OrdemProducaoSimples[];
  isLoading: boolean;
  cor: string;
  onOrdemClick: (ordem: OrdemProducaoSimples) => void;  // NOVO
}

// No map:
{ordens.map((ordem, index) => (
  <OrdemProducaoCard 
    key={ordem.id} 
    ordem={ordem} 
    posicao={index + 1}
    tipo={tipo}
    onOrdemClick={onOrdemClick}
  />
))}
```

### 3. Pagina `CronogramaProducao.tsx`

**Adicionar estado e Sheet:**

```typescript
import { OrdemLinhasSheet } from "@/components/fabrica/OrdemLinhasSheet";
import { OrdemStatus, TipoOrdem } from "@/hooks/useOrdensPorPedido";

// Estado para controlar a sidebar
const [ordemSelecionada, setOrdemSelecionada] = useState<{
  ordem: OrdemStatus | null;
  numeroPedido: string;
  clienteNome: string;
} | null>(null);

// Handler para converter OrdemProducaoSimples -> OrdemStatus
const handleOrdemClick = (ordem: OrdemProducaoSimples, tipo: TipoOrdemProducao) => {
  const ordemStatus: OrdemStatus = {
    existe: true,
    id: ordem.id,
    numero_ordem: ordem.numero_ordem,
    status: ordem.status,
    tipo: tipo as TipoOrdem,
    responsavel: ordem.responsavel_nome ? {
      nome: ordem.responsavel_nome,
      foto_url: null,
      iniciais: ordem.responsavel_nome.substring(0, 2).toUpperCase()
    } : null,
    responsavel_id: ordem.responsavel_id || null,
    pausada: ordem.pausada || false,
    justificativa_pausa: ordem.justificativa_pausa || null,
    pausada_em: null,
    linha_problema: null,
    linhas_concluidas: 0,
    total_linhas: 0,
    capturada_em: null,
    tempo_acumulado_segundos: null,
    tempo_conclusao_segundos: null,
    data_agendamento: null,
    hora_agendamento: null,
    responsavel_nome: null,
    tipo_responsavel: null,
  };
  
  setOrdemSelecionada({
    ordem: ordemStatus,
    numeroPedido: ordem.numero_pedido,
    clienteNome: ordem.cliente_nome,
  });
};

// Render da Sheet no final do JSX
<OrdemLinhasSheet
  ordem={ordemSelecionada?.ordem || null}
  numeroPedido={ordemSelecionada?.numeroPedido}
  clienteNome={ordemSelecionada?.clienteNome}
  open={!!ordemSelecionada}
  onOpenChange={(open) => !open && setOrdemSelecionada(null)}
/>
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/cronograma/OrdemProducaoCard.tsx` | Redesenhar para layout de 45px horizontal, adicionar click handler |
| `src/components/cronograma/ColunaOrdensProducao.tsx` | Adicionar prop onOrdemClick e repassar para cards |
| `src/pages/fabrica/CronogramaProducao.tsx` | Adicionar estado da sidebar, converter dados, renderizar OrdemLinhasSheet |

## Secao Tecnica: Conversao de Tipos

A `OrdemLinhasSheet` espera um `OrdemStatus` mas temos `OrdemProducaoSimples`. Campos mapeados:

| OrdemProducaoSimples | OrdemStatus |
|---------------------|-------------|
| id | id |
| numero_ordem | numero_ordem |
| status | status |
| (passado como prop) | tipo |
| responsavel_nome | responsavel.nome |
| responsavel_id | responsavel_id |
| pausada | pausada |
| justificativa_pausa | justificativa_pausa |

## Resultado Visual Esperado

Card compacto de 45px:
```
+------------------------------------------------------+
| ⋮ [1] PERF-123 | João Silv... | ●● | 12m² | [Disp] ● |
+------------------------------------------------------+
```

Ao clicar, abre a sidebar direita com:
- Detalhes da ordem
- Lista de linhas para marcar como concluidas
- Status de pausa e motivo (se houver)
- Acoes como regenerar linhas e remover responsavel
