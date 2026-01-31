
# Plano: Corrigir Cálculo de Progresso e Adicionar Barra Permanente

## Problemas Identificados

### Problema 1: Progresso ignorando datas da meta
**Local:** `src/pages/MetasColaboradorIndividual.tsx`

O código atual (linhas 44-82):
```typescript
// Sempre usa o mês inteiro
const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
const dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

// Soma todo o mês independente da meta
const totaisMes = desempenho.reduce(...);

// Retorna total do mês
const getProgressoMeta = (tipo) => totaisMes[tipo];
```

**Resultado:** Se o usuário já perfilou 9000m antes da meta começar, mostra 9000/10000 ao invés de 0/10000.

### Problema 2: Barra de progresso não visível permanentemente
**Local:** `src/pages/ProducaoPerfiladeira.tsx`

A barra `MetaProgressoFlutuante` só aparece por 5 segundos após concluir uma ordem. O usuário quer ver seu progresso o tempo todo.

---

## Solução

### Parte 1: Criar hook para calcular progresso respeitando datas da meta

**Novo arquivo:** `src/hooks/useMetaProgressoCalculado.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetaColaborador } from "./useMetasColaboradorIndividual";

// Calcula progresso usando as datas específicas da meta
async function calcularProgressoMeta(
  userId: string,
  meta: MetaColaborador
): Promise<number> {
  const { data_inicio, data_termino, tipo_meta } = meta;

  switch (tipo_meta) {
    case 'perfiladeira': {
      const { data } = await supabase
        .from("ordens_perfiladeira")
        .select("metragem_linear")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino);
      return (data || []).reduce((acc, item) => 
        acc + (Number(item.metragem_linear) || 0), 0);
    }
    case 'solda': {
      const { data } = await supabase
        .from("ordens_soldagem")
        .select("qtd_portas_p, qtd_portas_g")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino);
      return (data || []).reduce((acc, item) => 
        acc + (Number(item.qtd_portas_p) || 0) + (Number(item.qtd_portas_g) || 0), 0);
    }
    // ... outros tipos
    default:
      return 0;
  }
}

export function useMetaProgressoCalculado(userId: string, metas: MetaColaborador[]) {
  return useQuery({
    queryKey: ["metas-progresso-calculado", userId, metas.map(m => m.id).join(",")],
    queryFn: async () => {
      const progressos: Record<string, number> = {};
      for (const meta of metas) {
        progressos[meta.id] = await calcularProgressoMeta(userId, meta);
      }
      return progressos;
    },
    enabled: !!userId && metas.length > 0,
  });
}
```

### Parte 2: Atualizar página de metas do colaborador

**Arquivo:** `src/pages/MetasColaboradorIndividual.tsx`

Modificar para usar o progresso calculado por meta:

```typescript
// Importar novo hook
import { useMetaProgressoCalculado } from "@/hooks/useMetaProgressoCalculado";

// Usar o hook com as metas
const { data: progressosPorMeta } = useMetaProgressoCalculado(userId || "", metas || []);

// Modificar getProgressoMeta para usar progresso específico da meta
const getProgressoMeta = (metaId: string) => {
  return progressosPorMeta?.[metaId] || 0;
};

// No MetaCard, passar o id da meta
<MetaCard
  meta={meta}
  progressoAtual={getProgressoMeta(meta.id)}  // Usar ID da meta
  ...
/>
```

### Parte 3: Criar componente de barra de progresso permanente

**Novo arquivo:** `src/components/metas/MetaProgressoBar.tsx`

```typescript
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Ruler, Trophy, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetaProgressoBarProps {
  userId: string;
  tipoMeta: 'perfiladeira' | 'solda' | 'separacao' | 'qualidade' | 'pintura' | 'carregamento';
}

export function MetaProgressoBar({ userId, tipoMeta }: MetaProgressoBarProps) {
  const { data: metaInfo } = useQuery({
    queryKey: ["meta-ativa-progresso", userId, tipoMeta],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      
      // Buscar meta ativa
      const { data: meta } = await supabase
        .from("metas_colaboradores")
        .select("*")
        .eq("user_id", userId)
        .eq("tipo_meta", tipoMeta)
        .eq("concluida", false)
        .lte("data_inicio", hoje)
        .gte("data_termino", hoje)
        .single();

      if (!meta) return null;

      // Calcular progresso respeitando datas da meta
      let progresso = 0;
      if (tipoMeta === 'perfiladeira') {
        const { data } = await supabase
          .from("ordens_perfiladeira")
          .select("metragem_linear")
          .eq("responsavel_id", userId)
          .eq("status", "concluido")
          .gte("data_conclusao", meta.data_inicio)
          .lte("data_conclusao", meta.data_termino);
        progresso = (data || []).reduce((acc, item) => 
          acc + (Number(item.metragem_linear) || 0), 0);
      }
      // ... outros tipos

      return {
        meta,
        progresso,
        porcentagem: Math.min((progresso / meta.valor_meta) * 100, 100),
      };
    },
    enabled: !!userId,
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  if (!metaInfo) return null;

  const { meta, progresso, porcentagem } = metaInfo;
  const atingida = porcentagem >= 100;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Meta Ativa</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {progresso.toFixed(1)} / {meta.valor_meta.toLocaleString()} m
        </span>
      </div>
      <Progress value={porcentagem} className="h-2" />
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">
          {porcentagem.toFixed(0)}%
        </span>
        {atingida && (
          <span className="text-xs text-green-500 flex items-center gap-1">
            <Trophy className="h-3 w-3" /> Meta atingida!
          </span>
        )}
      </div>
    </div>
  );
}
```

### Parte 4: Adicionar barra na página de produção

**Arquivo:** `src/pages/ProducaoPerfiladeira.tsx`

```typescript
import { MetaProgressoBar } from "@/components/metas/MetaProgressoBar";

// No retorno do componente, adicionar antes do ProducaoKanban:
return (
  <div className="container mx-auto py-6 space-y-6">
    {/* Barra de progresso da meta */}
    {user?.user_id && (
      <MetaProgressoBar userId={user.user_id} tipoMeta="perfiladeira" />
    )}

    <ProducaoKanban ... />
    ...
  </div>
);
```

---

## Fluxo de Dados Corrigido

```text
Antes (incorreto):
┌─────────────────────────────────────────────┐
│ Meta criada: 20/01 a 31/01                  │
│ Produção antes da meta: 9000m              │
│ Exibido: 9000/10000 (90%)                  │
└─────────────────────────────────────────────┘

Depois (correto):
┌─────────────────────────────────────────────┐
│ Meta criada: 20/01 a 31/01                  │
│ Produção de 20/01 a 31/01: 500m            │
│ Exibido: 500/10000 (5%)                    │
└─────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useMetaProgressoCalculado.ts` | **Novo** - Hook para calcular progresso por meta |
| `src/pages/MetasColaboradorIndividual.tsx` | Usar progresso calculado por data da meta |
| `src/components/metas/MetaProgressoBar.tsx` | **Novo** - Barra permanente de progresso |
| `src/pages/ProducaoPerfiladeira.tsx` | Adicionar `MetaProgressoBar` |
| `src/pages/fabrica/producao/PerfiladeiraMinimalista.tsx` | Adicionar `MetaProgressoBar` (versão minimalista) |

## Resultado Esperado

1. Na página de metas do colaborador: progresso calculado apenas dentro do período de vigência da meta
2. Na página `/producao/perfiladeira`: barra de progresso sempre visível no topo mostrando a meta ativa e progresso atualizado
