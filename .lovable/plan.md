
## Plano: Corrigir Erro de NOT NULL na Coluna `hora` da Tabela `instalacoes`

### Problema Identificado

O erro `null value in column "hora" of relation "instalacoes" violates not-null constraint` ocorre porque:

1. O modal `AdicionarOrdemCalendarioModal` define `horaFinal = null` para instalações (linha 210)
2. O componente `OrdensCarregamentoDisponiveis.tsx` passa `hora: params.hora` (linha 104) diretamente para o update
3. A tabela `instalacoes` tem a coluna `hora` com constraint `NOT NULL` e default `'08:00'`

O default `'08:00'` só funciona em **INSERT** quando o valor não é especificado. Em **UPDATE** com valor explícito `null`, o constraint NOT NULL falha.

### Análise da Estrutura

| Tabela | Coluna | Nullable | Default |
|--------|--------|----------|---------|
| `instalacoes` | `hora` | **NÃO** | `'08:00'` |
| `instalacoes` | `hora_carregamento` | SIM | null |
| `neo_instalacoes` | `hora` | SIM | null |
| `neo_correcoes` | `hora` | SIM | null |

### Solução Proposta

Corrigir os pontos onde `hora: null` é passado para updates na tabela `instalacoes`, usando `'08:00'` como valor padrão quando a hora não é especificada.

### Arquivos a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx` | 210 | Usar `'08:00'` em vez de `null` para instalações |
| `src/components/expedicao/OrdensCarregamentoDisponiveis.tsx` | 104 | Usar valor padrão quando hora é null para instalações |
| `src/components/expedicao/OrdensCarregamentoDisponiveisMobile.tsx` | (verificar) | Mesmo padrão se aplicável |

### Detalhes Técnicos

#### 1. AdicionarOrdemCalendarioModal.tsx (linha 210)

```typescript
// ANTES
const horaFinal = isEntrega ? hora : null;

// DEPOIS - Usar "08:00" como default para instalações
const horaFinal = isEntrega ? hora : "08:00";
```

#### 2. OrdensCarregamentoDisponiveis.tsx (linhas 99-111)

```typescript
// ANTES
const { error } = await supabase
  .from(tabela)
  .update({
    data_carregamento: params.data_carregamento,
    hora_carregamento: params.hora,
    hora: params.hora,  // <-- Problema: passa null para instalações
    // ...
  })
  .eq("id", params.ordemId);

// DEPOIS - Para instalações, usar valor padrão se hora for null
const isInstalacao = params.fonte === 'instalacoes';
const horaValue = isInstalacao ? (params.hora || "08:00") : params.hora;

const { error } = await supabase
  .from(tabela)
  .update({
    data_carregamento: params.data_carregamento,
    hora_carregamento: params.hora,
    hora: horaValue,  // <-- Usa default para instalações
    // ...
  })
  .eq("id", params.ordemId);
```

#### 3. Verificar OrdensCarregamentoDisponiveisMobile.tsx

Aplicar a mesma correção se houver lógica similar de agendamento.

### Resultado Esperado

- Instalações podem ser agendadas sem erros
- Campo de hora permanece oculto para instalações/manutenções no modal
- Valor padrão `'08:00'` é usado automaticamente para satisfazer o constraint NOT NULL
- Consistência com a política "date-only" para instalações (hora não é relevante para o usuário, mas necessária para o banco)
