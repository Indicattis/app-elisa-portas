

# Plano: Exibir Tempo Corrido das Ordens em /fabrica/ordens-pedidos

## Objetivo

Adicionar a exibição do tempo decorrido total de cada ordem na página de Ordens por Pedido, reutilizando a lógica existente do cronômetro que considera apenas horário de expediente.

---

## Alterações Necessárias

### 1. Atualizar Hook `useOrdensPorPedido.ts`

Adicionar os campos necessários para o cronômetro nas queries de cada tipo de ordem:

| Campo | Descrição |
|-------|-----------|
| `capturada_em` | Data/hora de captura da ordem |
| `tempo_acumulado_segundos` | Tempo já acumulado (pausas anteriores) |
| `tempo_conclusao_segundos` | Tempo final (se concluída) |

**Atualizar o tipo `OrdemStatus`:**
```typescript
export interface OrdemStatus {
  // ... campos existentes ...
  capturada_em: string | null;
  tempo_acumulado_segundos: number | null;
  tempo_conclusao_segundos: number | null;
}
```

### 2. Criar Componente `OrdemCronometro.tsx`

Componente compacto que usa o hook `useCronometroOrdem` para exibir o tempo decorrido com animação quando ativo:

```text
┌─────────────┐
│ ⏱️ 02:45:30 │  <- Animado quando em expediente
└─────────────┘
```

### 3. Atualizar Componente `PedidoOrdemCard.tsx`

Adicionar o cronômetro em cada badge de ordem no painel expandido, mostrando o tempo ao lado do contador de linhas.

---

## Detalhes Técnicos

### Campos a Adicionar nas Queries (useOrdensPorPedido.ts)

**Para cada tabela de ordem:**
```typescript
// Soldagem
.select(`
  id, pedido_id, numero_ordem, status, responsavel_id, pausada, justificativa_pausa, pausada_em,
  capturada_em, tempo_acumulado_segundos, tempo_conclusao_segundos,  // NOVOS
  linha_problema_id,
  linha_problema:linha_problema_id (id, item, quantidade, tamanho)
`)

// Perfiladeira, Separação, Qualidade, Pintura - mesma adição
```

### Atualização do Tipo OrdemStatus

```typescript
export interface OrdemStatus {
  existe: boolean;
  id: string | null;
  numero_ordem: string | null;
  status: string | null;
  tipo: TipoOrdem;
  responsavel: ResponsavelInfo | null;
  responsavel_id: string | null;
  pausada: boolean;
  justificativa_pausa: string | null;
  pausada_em: string | null;
  linha_problema: LinhaProblemaInfo | null;
  linhas_concluidas: number;
  total_linhas: number;
  // Novos campos para cronômetro
  capturada_em: string | null;
  tempo_acumulado_segundos: number | null;
  tempo_conclusao_segundos: number | null;
}
```

### Componente OrdemCronometro

```typescript
// src/components/fabrica/OrdemCronometro.tsx
import { Timer } from "lucide-react";
import { useCronometroOrdem } from "@/hooks/useCronometroOrdem";
import { cn } from "@/lib/utils";

interface OrdemCronometroProps {
  ordem: {
    capturada_em: string | null;
    tempo_acumulado_segundos: number | null;
    tempo_conclusao_segundos: number | null;
    pausada: boolean;
    responsavel_id: string | null;
    status: string | null;
    linhas_concluidas: number;
    total_linhas: number;
  };
}

export function OrdemCronometro({ ordem }: OrdemCronometroProps) {
  const todasConcluidas = ordem.total_linhas > 0 
    ? ordem.linhas_concluidas >= ordem.total_linhas 
    : ordem.status === 'concluido';

  const { tempoDecorrido, deveAnimar } = useCronometroOrdem({
    capturada_em: ordem.capturada_em,
    tempo_acumulado_segundos: ordem.tempo_acumulado_segundos,
    tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
    pausada: ordem.pausada,
    responsavel_id: ordem.responsavel_id,
    todas_linhas_concluidas: todasConcluidas,
  });

  // Não mostrar se não tem tempo
  if (tempoDecorrido === '--:--:--') return null;

  return (
    <div className={cn(
      "flex items-center gap-1 text-[10px]",
      deveAnimar && "animate-pulse"
    )}>
      <Timer className="w-3 h-3" />
      <span className="font-mono">{tempoDecorrido}</span>
    </div>
  );
}
```

### Integração no PedidoOrdemCard

Adicionar o cronômetro no botão de cada ordem:

```tsx
{/* Dentro do botão de ordem expandido */}
<div className="flex items-center gap-1.5 flex-shrink-0">
  {/* Cronômetro - NOVO */}
  {ordem.existe && (
    <OrdemCronometro ordem={ordem} />
  )}
  
  {/* Pausa (existente) */}
  {ordem.pausada && (...)}
  
  {/* Avatar e contador (existente) */}
  {ordem.responsavel && (...)}
</div>
```

---

## Arquivos a Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/hooks/useOrdensPorPedido.ts` | Editar | Adicionar campos do cronômetro nas queries e tipo |
| `src/components/fabrica/OrdemCronometro.tsx` | **Criar** | Componente de exibição do cronômetro |
| `src/components/fabrica/PedidoOrdemCard.tsx` | Editar | Integrar componente de cronômetro |

---

## Layout Visual (Painel Expandido)

```text
┌───────────────────────────────────────────────────────────────┐
│ [v] #1234  Cliente ABC  RAL 9010  Campo Grande/MS  ...        │
├───────────────────────────────────────────────────────────────┤
│ Cliente ABC Materiais LTDA                                     │
│ ┌─────────────────────┐ ┌─────────────────────┐               │
│ │ Soldagem            │ │ Perfiladeira        │               │
│ │ Em andamento        │ │ Pendente            │               │
│ │ ⏱️ 02:15:30  👤 3/5 │ │               0/8   │               │
│ └─────────────────────┘ └─────────────────────┘               │
│ ┌─────────────────────┐ ┌─────────────────────┐               │
│ │ Separação           │ │ Qualidade           │               │
│ │ Pausada  ⏸️         │ │ Sem ordem           │               │
│ │ ⏱️ 01:30:00         │ │                     │               │
│ └─────────────────────┘ └─────────────────────┘               │
└───────────────────────────────────────────────────────────────┘
```

---

## Comportamento do Cronômetro

| Estado | Exibição |
|--------|----------|
| **Sem captura** | Não exibe cronômetro |
| **Em andamento (expediente)** | `⏱️ 02:15:30` com animação pulse |
| **Em andamento (fora expediente)** | `⏱️ 02:15:30` sem animação (congelado) |
| **Pausada** | `⏱️ 01:30:00` tempo acumulado, sem animação |
| **Concluída** | `⏱️ 03:45:00` tempo final, sem animação |

---

## Resultado Esperado

1. Cada ordem exibe o tempo decorrido no painel expandido
2. O cronômetro considera apenas horário de expediente (7h-17h)
3. Ordens pausadas mostram o tempo congelado
4. Ordens concluídas mostram o tempo total final
5. Animação visual (pulse) quando o cronômetro está ativo

