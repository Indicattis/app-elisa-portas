
# Plano: Cronograma de Producao com Prioridade de Ordens

## Resumo

Criar uma nova pagina `/fabrica/cronograma-producao` que permite visualizar e reordenar a prioridade das ordens de producao (Perfiladeira, Solda, Separacao, Qualidade, Pintura) usando drag-and-drop, sem mais bloquear a captura baseada na ordem de prioridade.

## Alteracoes Necessarias

### 1. Remover Bloqueio de Prioridade na Captura

**Arquivo:** `src/hooks/useOrdemProducao.ts`

Remover as linhas 317-339 que verificam se a ordem sendo capturada e a proxima na fila de prioridade. Isso permitira que operadores capturem qualquer ordem disponivel.

**Codigo a remover:**
```typescript
// Permitir captura fora da ordem de prioridade apenas para ordens pausadas
if (!ordemParaCapturar?.pausada) {
  const { data: ordensDisponiveis, error: ordensError } = await supabase
    .from(tabelaOrdem)
    .select('id, numero_ordem, prioridade, pausada')
    ...
  if (proximaOrdem.id !== ordemId) {
    throw new Error(`Você deve capturar a ordem ${proximaOrdem.numero_ordem} primeiro.`);
  }
}
```

### 2. Adicionar Botao no Hub da Fabrica

**Arquivo:** `src/pages/fabrica/FabricaHub.tsx`

Adicionar novo item no menu:
```typescript
{ label: 'Cronograma Producao', icon: Calendar, path: '/fabrica/cronograma-producao' }
```

E no mapeamento de rotas:
```typescript
'/fabrica/cronograma-producao': 'fabrica_cronograma_producao'
```

### 3. Criar Hook para Gerenciar Ordens de Producao

**Novo arquivo:** `src/hooks/useOrdensProducaoPrioridade.ts`

Hook que:
- Busca ordens de cada tipo (perfiladeira, soldagem, separacao, qualidade, pintura) que nao estao concluidas
- Ordena por prioridade (maior primeiro)
- Permite reorganizar prioridades via drag-and-drop
- Atualiza em tempo real

```typescript
interface OrdemProducaoSimples {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  prioridade: number;
  cliente_nome: string;
  numero_pedido: string;
  responsavel_nome?: string;
}

type TipoOrdemProducao = 'perfiladeira' | 'soldagem' | 'separacao' | 'qualidade' | 'pintura';

export function useOrdensProducaoPrioridade(tipo: TipoOrdemProducao) {
  // Query para buscar ordens do tipo
  // Mutation para reorganizar prioridades
  // Retorna { ordens, reorganizarOrdens, isLoading }
}
```

### 4. Criar Pagina de Cronograma de Producao

**Novo arquivo:** `src/pages/fabrica/CronogramaProducao.tsx`

Layout em colunas (similar ao Kanban):

```text
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ PERFILADEIRA│   SOLDA     │  SEPARACAO  │  QUALIDADE  │   PINTURA   │
│    (12)     │    (8)      │    (15)     │    (5)      │    (7)      │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ [Arrastar]  │ [Arrastar]  │ [Arrastar]  │ [Arrastar]  │ [Arrastar]  │
│ Ordem 001   │ Ordem 005   │ Ordem 010   │ Ordem 015   │ Ordem 020   │
│ Cliente A   │ Cliente B   │ Cliente C   │ Cliente D   │ Cliente E   │
│─────────────│─────────────│─────────────│─────────────│─────────────│
│ Ordem 002   │ Ordem 006   │ Ordem 011   │ Ordem 016   │ Ordem 021   │
│ Cliente F   │ Cliente G   │ Cliente H   │ Cliente I   │ Cliente J   │
│   ...       │   ...       │   ...       │   ...       │   ...       │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

Funcionalidades:
- 5 colunas lado a lado (scroll horizontal em mobile)
- Cada coluna mostra ordens ordenadas por prioridade
- Drag-and-drop dentro de cada coluna para reordenar
- Badge de posicao (1o, 2o, 3o...)
- Nome do cliente e numero do pedido
- Status visual (disponivel, em andamento, pausada)
- Responsavel atual se houver

### 5. Criar Componente de Coluna de Ordens

**Novo arquivo:** `src/components/cronograma/ColunaOrdensProducao.tsx`

Componente reutilizavel para cada coluna:
- Titulo com contador
- Lista de ordens com drag-and-drop usando @dnd-kit
- Card de ordem com informacoes resumidas
- Cores diferentes para cada status

### 6. Criar Componente de Card de Ordem

**Novo arquivo:** `src/components/cronograma/OrdemProducaoCard.tsx`

Card compacto mostrando:
- Posicao na fila (badge numerico)
- Numero da ordem
- Cliente + numero pedido
- Status (badge colorido)
- Avatar do responsavel (se capturada)
- Handle de arraste

### 7. Registrar Rota no App Router

**Arquivo:** `src/App.tsx` (ou arquivo de rotas)

Adicionar rota:
```typescript
<Route path="/fabrica/cronograma-producao" element={<CronogramaProducao />} />
```

### 8. Registrar Rota no Banco de Dados

**Migracao SQL:**
```sql
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, sort_order, active)
VALUES ('fabrica_cronograma_producao', '/fabrica/cronograma-producao', 'Cronograma Produção', 'Calendar', 'fabrica', 'hub_fabrica', 25, true);
```

## Estrutura de Arquivos

```text
src/
├── hooks/
│   └── useOrdensProducaoPrioridade.ts (NOVO)
├── pages/fabrica/
│   ├── FabricaHub.tsx (MODIFICAR)
│   └── CronogramaProducao.tsx (NOVO)
├── components/cronograma/
│   ├── ColunaOrdensProducao.tsx (NOVO)
│   └── OrdemProducaoCard.tsx (NOVO)
```

## Fluxo de Uso

1. Usuario acessa `/fabrica`
2. Clica em "Cronograma Producao"
3. Ve as 5 colunas com ordens de cada etapa
4. Arrasta ordens dentro de cada coluna para reordenar
5. Sistema atualiza prioridade no banco
6. Operadores veem ordens ordenadas mas podem capturar qualquer uma

## Detalhes Tecnicos

### Hook useOrdensProducaoPrioridade

```typescript
export function useOrdensProducaoPrioridade(tipo: TipoOrdemProducao) {
  const queryClient = useQueryClient();
  const tabela = TABELA_MAP[tipo];

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ['ordens-prioridade', tipo],
    queryFn: async () => {
      const { data } = await supabase
        .from(tabela)
        .select(`
          id, numero_ordem, pedido_id, status, prioridade, responsavel_id,
          pedido:pedidos_producao(numero_pedido, cliente_nome)
        `)
        .eq('historico', false)
        .order('prioridade', { ascending: false });
      return data;
    }
  });

  const reorganizar = useMutation({
    mutationFn: async (updates: { id: string; prioridade: number }[]) => {
      for (const { id, prioridade } of updates) {
        await supabase.from(tabela).update({ prioridade }).eq('id', id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['ordens-prioridade', tipo])
  });

  return { ordens, reorganizar, isLoading };
}
```

### Layout Responsivo

- Desktop: 5 colunas lado a lado
- Tablet: 3 colunas com scroll
- Mobile: 1 coluna com seletor de etapa (tabs ou dropdown)

## Resultado Esperado

- Gestores podem definir prioridade das ordens individualmente por etapa
- Operadores veem a lista ordenada mas nao sao bloqueados de capturar
- Interface visual clara do "cronograma" de producao
- Drag-and-drop intuitivo para reordenamento
