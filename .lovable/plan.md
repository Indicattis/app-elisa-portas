
# Plano: Melhorias nas Listagens de Expedição

## Visao Geral

Implementar tres melhorias na pagina `/logistica/expedicao`:

1. **Adicionar coluna de vendedor/criador** nas listagens
2. **Abrir downbar ao clicar** nos elementos das tabelas
3. **Substituir input de hora por mini calendario** no modal de agendamento

---

## 1. Adicionar Coluna do Vendedor/Criador

### Fonte de Dados

| Tipo de Item | Fonte do Responsavel |
|--------------|---------------------|
| Ordens de Carregamento | `vendas.atendente_id` -> join com `admin_users` |
| Instalacoes (da tabela instalacoes) | `vendas.atendente_id` -> join com `admin_users` |
| Neo Instalacoes | `neo_instalacoes.created_by` -> join com `admin_users` |
| Neo Correcoes | `neo_correcoes.created_by` -> join com `admin_users` |

### Alteracoes Necessarias

#### 1.1. Atualizar `useOrdensCarregamentoUnificadas.ts`

Modificar a query para incluir o atendente (vendedor) da venda:

```typescript
// Na query de vendas, adicionar:
venda:vendas(
  id,
  ...campos_existentes,
  atendente:admin_users!vendas_atendente_id_fkey(
    user_id,
    nome,
    foto_perfil_url
  )
)
```

Adicionar o tipo `VendedorInfo` na interface `OrdemCarregamentoUnificada`:

```typescript
vendedor?: {
  id: string;
  nome: string;
  foto_perfil_url: string | null;
} | null;
```

#### 1.2. Atualizar `OrdensCarregamentoDisponiveis.tsx`

- Adicionar nova coluna "Vendedor" na tabela
- Exibir avatar pequeno + nome truncado do vendedor
- Largura da coluna: ~120px

#### 1.3. Atualizar `OrdensCarregamentoDisponiveisMobile.tsx`

- Adicionar avatar do vendedor no card mobile

#### 1.4. Atualizar `NeoServicosDisponiveis.tsx`

- Adicionar coluna "Criador" na tabela
- Buscar dados do criador via `created_by` (ja existe na query de `useNeoInstalacoesSemData` para listagem)
- Exibir avatar + nome do criador

---

## 2. Abrir Downbar ao Clicar no Elemento

### Componentes Afetados

| Componente | Downbar Existente |
|------------|-------------------|
| `OrdensCarregamentoDisponiveis.tsx` | `OrdemCarregamentoDetails` |
| `NeoServicosDisponiveis.tsx` | `NeoInstalacaoDetails` / `NeoCorrecaoDetails` |

### Alteracoes

#### 2.1. `OrdensCarregamentoDisponiveis.tsx`

- Adicionar state para `selectedOrdem` e `detailsOpen`
- Transformar a row da tabela em clicavel (exceto o botao "Agendar")
- Ao clicar na row, abrir `OrdemCarregamentoDetails`
- Importar e renderizar o componente `OrdemCarregamentoDetails`

```typescript
// Novos states
const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamentoUnificada | null>(null);
const [detailsOpen, setDetailsOpen] = useState(false);

// Handler
const handleOrdemClick = (ordem: OrdemCarregamentoUnificada) => {
  setSelectedOrdem(ordem);
  setDetailsOpen(true);
};
```

#### 2.2. `NeoServicosDisponiveis.tsx`

- Adicionar states para Neo Instalacao e Neo Correcao details
- Ao clicar na row, identificar o tipo e abrir o downbar correspondente
- Importar e renderizar `NeoInstalacaoDetails` e `NeoCorrecaoDetails`

---

## 3. Modal de Agendamento com Mini Calendario

### Arquivos Afetados

- `AdicionarOrdemCalendarioModal.tsx` (ordens de carregamento)
- `NeoServicosDisponiveis.tsx` (neo services - modal interno)

### Alteracoes em `AdicionarOrdemCalendarioModal.tsx`

#### 3.1. Remover Input de Hora

O input de hora ja e ocultado para instalacoes (linha 368-378). Para entregas, a hora tambem deve ser removida conforme solicitado.

#### 3.2. Adicionar State para Data Selecionada

```typescript
const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
```

#### 3.3. Substituir a data fixa por mini calendario

Usar o componente `Calendar` do shadcn:

```typescript
import { Calendar } from "@/components/ui/calendar";

// Remover input de hora completamente
// Adicionar calendario inline:
<div className="space-y-2">
  <Label>Data do Carregamento *</Label>
  <div className="border rounded-lg p-2">
    <Calendar
      mode="single"
      selected={dataSelecionada}
      onSelect={setDataSelecionada}
      locale={ptBR}
      className="pointer-events-auto"
      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
    />
  </div>
</div>
```

#### 3.4. Atualizar handleConfirm

Usar a data selecionada do calendario ao inves de `dataSelecionada` (prop):

```typescript
const handleConfirm = async () => {
  if (!dataSelecionada) {
    toast.error("Selecione uma data");
    return;
  }
  // ... resto da logica
  await onConfirm({
    // ...
    data_carregamento: format(dataSelecionada, "yyyy-MM-dd"),
    hora: "08:00", // Hora fixa padrao
    // ...
  });
};
```

### Alteracoes em `NeoServicosDisponiveis.tsx`

O modal interno ja usa apenas data (sem hora). Substituir o input `type="date"` por um mini calendario:

```typescript
<div className="space-y-2">
  <Label>Data *</Label>
  <Calendar
    mode="single"
    selected={dataAgendamento ? new Date(dataAgendamento) : undefined}
    onSelect={(date) => setDataAgendamento(date ? format(date, 'yyyy-MM-dd') : '')}
    locale={ptBR}
    className="pointer-events-auto rounded-md border"
  />
</div>
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useOrdensCarregamentoUnificadas.ts` | Adicionar join com `admin_users` para vendedor |
| `src/types/ordemCarregamentoUnificada.ts` | Adicionar tipo `vendedor` na interface (se existir) |
| `src/components/expedicao/OrdensCarregamentoDisponiveis.tsx` | Adicionar coluna vendedor + clique para downbar |
| `src/components/expedicao/OrdensCarregamentoDisponiveisMobile.tsx` | Adicionar avatar vendedor |
| `src/components/expedicao/NeoServicosDisponiveis.tsx` | Adicionar coluna criador + clique para downbar + calendario no modal |
| `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx` | Remover hora + adicionar mini calendario |

---

## Detalhes Tecnicos

### Busca de Criador para Neo Services

Os hooks `useNeoInstalacoesSemData` e `useNeoCorrecoesSemData` precisam ser atualizados para buscar os dados do criador (`created_by` -> `admin_users`), similar ao que ja existe em `useNeoInstalacoesListagem`.

### Hora Padrao

Conforme regra de negocio existente (`business-rules/installations-date-only-policy`), a hora "08:00" e usada como valor padrao quando o campo de hora e oculto.

### Compatibilidade de Tipos

O componente `OrdemCarregamentoDetails` espera um tipo `OrdemCarregamento`. Sera necessario adaptar ou criar um tipo compativel para `OrdemCarregamentoUnificada`.

