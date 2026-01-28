
## Plano: Sinalizar Ordens Pausadas em /fabrica/ordens-pedidos

### Objetivo
Exibir um indicador visual para ordens pausadas e mostrar o motivo da pausa em um tooltip.

---

### Mudanca 1: Atualizar Interface OrdemStatus

**Arquivo:** `src/hooks/useOrdensPorPedido.ts`

Adicionar campos de pausa na interface:

```typescript
export interface OrdemStatus {
  existe: boolean;
  id: string | null;
  numero_ordem: string | null;
  status: string | null;
  tipo: TipoOrdem;
  responsavel: ResponsavelInfo | null;
  // NOVOS CAMPOS:
  pausada: boolean;
  justificativa_pausa: string | null;
  pausada_em: string | null;
}
```

---

### Mudanca 2: Buscar Campos de Pausa nas Queries

**Arquivo:** `src/hooks/useOrdensPorPedido.ts`

Atualizar as queries para incluir os campos de pausa:

```typescript
// Soldagem
supabase
  .from('ordens_soldagem')
  .select('id, pedido_id, numero_ordem, status, responsavel_id, pausada, justificativa_pausa, pausada_em')
  .in('pedido_id', pedidoIds),

// Perfiladeira
supabase
  .from('ordens_perfiladeira')
  .select('id, pedido_id, numero_ordem, status, responsavel_id, metragem_linear, pausada, justificativa_pausa, pausada_em')
  .in('pedido_id', pedidoIds),

// Separacao
supabase
  .from('ordens_separacao')
  .select('id, pedido_id, numero_ordem, status, responsavel_id, pausada, justificativa_pausa, pausada_em')
  .in('pedido_id', pedidoIds),
```

---

### Mudanca 3: Atualizar Funcao criarOrdemStatus

**Arquivo:** `src/hooks/useOrdensPorPedido.ts`

Incluir campos de pausa no retorno:

```typescript
const criarOrdemStatus = (tipo: TipoOrdem): OrdemStatus => {
  const ordem = ordensDosPedido[tipo];
  const responsavelId = ordem?.responsavel_id;
  return {
    existe: !!ordem,
    id: ordem?.id || null,
    numero_ordem: ordem?.numero_ordem || null,
    status: ordem?.status || null,
    tipo,
    responsavel: responsavelId ? responsaveisMap[responsavelId] || null : null,
    // NOVOS CAMPOS:
    pausada: ordem?.pausada || false,
    justificativa_pausa: ordem?.justificativa_pausa || null,
    pausada_em: ordem?.pausada_em || null,
  };
};
```

---

### Mudanca 4: Exibir Indicador Visual no Card

**Arquivo:** `src/components/fabrica/PedidoOrdemCard.tsx`

Adicionar estilo especial e icone de pausa:

```typescript
import { Pause } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Na funcao getStatusStyle, adicionar caso para pausada:
const getStatusStyle = (status: string | null, pausada: boolean) => {
  if (pausada) {
    return 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30';
  }
  // ... resto mantido
};

// No botao de cada ordem:
<button
  className={cn(
    "...",
    getStatusStyle(ordem.status, ordem.pausada)
  )}
>
  <div className="flex flex-col items-start gap-0.5 min-w-0">
    <span className="font-medium text-xs">{ORDEM_LABELS[ordem.tipo]}</span>
    <span className="text-[10px] opacity-80">
      {ordem.pausada ? 'Pausada' : (ordem.existe ? getStatusLabel(ordem.status) : 'Sem ordem')}
    </span>
  </div>
  
  {/* Indicador de pausa com tooltip */}
  {ordem.pausada && (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex-shrink-0 p-1 rounded-full bg-red-500/30">
            <Pause className="w-3 h-3 text-red-400 fill-red-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs font-medium">Motivo da pausa:</p>
          <p className="text-xs text-zinc-400">{ordem.justificativa_pausa || 'Não informado'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )}
  
  {/* Avatar responsavel (apenas se nao pausada) */}
  {!ordem.pausada && ordem.responsavel && (
    <Avatar>...</Avatar>
  )}
</button>
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useOrdensPorPedido.ts` | Adicionar campos pausada/justificativa nas queries e interface |
| `src/components/fabrica/PedidoOrdemCard.tsx` | Exibir icone de pausa com tooltip do motivo |

---

### Visual Final

**Ordem pausada:**
```
+------------------------------------------------+
| Separacao                    [PAUSE] [Avatar]  |
| Pausada                                        |
+------------------------------------------------+
          ^                       ^
          |                       Tooltip: "Falta de material X"
          Texto em vermelho
```

**Estilizacao:**
- Background: `bg-red-500/20`
- Texto: `text-red-300`
- Icone: Pause preenchido em vermelho
- Tooltip mostra justificativa
