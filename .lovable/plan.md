
# Ordenar pedidos e NEOs por status de carregamento nas etapas Instalacoes e Expedicao Coleta

## Objetivo

Nas etapas "Instalacoes" e "Expedicao Coleta" (aguardando_coleta), os pedidos e NEOs devem aparecer ordenados por prioridade de urgencia:

1. Nao agendado (sem data de carregamento)
2. Atrasado (data de carregamento no passado, nao carregado)
3. Agendado (data de carregamento no futuro, nao carregado)
4. Carregado (carregamento concluido)

## Mudancas

### 1. `src/hooks/usePedidosEtapas.ts` - Buscar dados de carregamento e ordenar

Na query de pedidos (dentro do `Promise.all` que enriquece cada pedido), para as etapas `aguardando_coleta` e `instalacoes`, buscar os dados de carregamento da tabela correspondente e anexar ao pedido:

- **aguardando_coleta**: buscar de `ordens_carregamento` (campos `data_carregamento`, `carregamento_concluido`)
- **instalacoes**: buscar de `instalacoes` (campos `data_carregamento`, `carregamento_concluido`)

Adicionar ao objeto retornado do pedido os campos `_carregamento_data` e `_carregamento_concluido`.

Apos o `Promise.all`, se a etapa for `aguardando_coleta` ou `instalacoes`, aplicar ordenacao customizada:

```typescript
if (etapa === 'aguardando_coleta' || etapa === 'instalacoes') {
  return pedidosComBacklog.sort((a, b) => {
    const getGrupo = (p: any) => {
      if (!p._carregamento_data) return 0; // Nao agendado
      if (p._carregamento_concluido) return 3; // Carregado
      const hoje = new Date().toISOString().split('T')[0];
      if (p._carregamento_data < hoje) return 1; // Atrasado
      return 2; // Agendado
    };
    const grupoA = getGrupo(a);
    const grupoB = getGrupo(b);
    if (grupoA !== grupoB) return grupoA - grupoB;
    // Dentro do mesmo grupo, ordenar por data (mais antiga primeiro)
    const dataA = a._carregamento_data || '9999-12-31';
    const dataB = b._carregamento_data || '9999-12-31';
    return dataA.localeCompare(dataB);
  });
}
```

### 2. `src/hooks/useNeoInstalacoes.ts` - Ordenar NEO instalacoes

No hook `useNeoInstalacoesListagem`, apos mapear os dados, aplicar ordenacao customizada baseada em `data_instalacao`:

- Sem data = grupo 0 (primeiro)
- Data no passado = grupo 1 (atrasado)
- Data no futuro = grupo 2 (agendado)

NEO instalacoes nao tem conceito de "carregado" (pois nao sao concluidas aqui), entao o grupo 3 nao se aplica.

### 3. `src/hooks/useNeoCorrecoes.ts` - Ordenar NEO correcoes

No hook `useNeoCorrecoesListagem`, aplicar a mesma logica baseada em `data_correcao`.

## Detalhes tecnicos

### Busca de carregamento no usePedidosEtapas

Dentro do `pedidosData.map(async (pedido) => {...})`, adicionar apos a busca de ordens de producao:

```typescript
// Buscar dados de carregamento para ordenacao
let _carregamento_data: string | null = null;
let _carregamento_concluido = false;

if (etapa === 'aguardando_coleta') {
  const { data: oc } = await supabase
    .from('ordens_carregamento')
    .select('data_carregamento, carregamento_concluido')
    .eq('pedido_id', pedido.id)
    .maybeSingle();
  _carregamento_data = oc?.data_carregamento || null;
  _carregamento_concluido = oc?.carregamento_concluido || false;
} else if (etapa === 'instalacoes') {
  const { data: inst } = await supabase
    .from('instalacoes')
    .select('data_carregamento, carregamento_concluido')
    .eq('pedido_id', pedido.id)
    .maybeSingle();
  _carregamento_data = inst?.data_carregamento || null;
  _carregamento_concluido = inst?.carregamento_concluido || false;
}
```

E incluir `_carregamento_data` e `_carregamento_concluido` no objeto de retorno.

### Impacto no drag-and-drop

O drag-and-drop para reorganizar prioridades continuara funcionando, mas a ordenacao visual sera pela regra de carregamento. O campo `prioridade_etapa` deixa de ser o criterio principal nestas duas etapas.

## Arquivos modificados

1. `src/hooks/usePedidosEtapas.ts` -- buscar carregamento + ordenar pedidos
2. `src/hooks/useNeoInstalacoes.ts` -- ordenar NEO instalacoes por data
3. `src/hooks/useNeoCorrecoes.ts` -- ordenar NEO correcoes por data
