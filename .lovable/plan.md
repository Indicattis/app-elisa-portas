

## Plano: Corrigir Modal de Agendamento e Erro na Tabela de Expedição

### Problema Identificado

Existem **dois problemas** na página `/logistica/expedicao`:

1. **Modal "+" não mostra instalações**: O `AdicionarOrdemCalendarioModal` usa o hook `useOrdensSemDataCarregamento` que busca **apenas** da tabela `ordens_carregamento`, ignorando instalações

2. **Erro ao agendar da tabela**: O `OrdensCarregamentoDisponiveis` passa uma ordem do tipo `OrdemCarregamentoUnificada` mas o modal espera o tipo antigo `OrdemCarregamento`. Quando tenta agendar, ocorre um erro de incompatibilidade de tipos

### Análise Técnica

| Componente | Problema |
|------------|----------|
| `AdicionarOrdemCalendarioModal` | Usa `useOrdensSemDataCarregamento` (apenas `ordens_carregamento`) |
| `OrdensCarregamentoDisponiveis` | Passa `ordemPreSelecionada` como tipo `OrdemCarregamentoUnificada` mas com cast `as any` |
| `handleConfirmAgendar` | Funciona corretamente, identifica `fonte` para escolher tabela |

**Linha 31 do modal:**
```typescript
ordemPreSelecionada?: OrdemCarregamento | null; // Tipo antigo
```

**Linha 396-397 do OrdensCarregamentoDisponiveis:**
```typescript
ordemPreSelecionada={ordemSelecionada as any} // Cast forçado causa problemas
```

---

### Solução

Atualizar o `AdicionarOrdemCalendarioModal` para:
1. Aceitar o tipo `OrdemCarregamentoUnificada` 
2. Usar o hook `useOrdensCarregamentoUnificadas` para buscar de ambas as fontes
3. Determinar a tabela correta na função `onConfirm` baseado na propriedade `fonte`

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx` | Modificar | Aceitar tipo unificado e usar hook unificado |
| `src/components/expedicao/OrdensCarregamentoDisponiveis.tsx` | Modificar | Remover cast `as any` |

---

### Parte 1: Modificar AdicionarOrdemCalendarioModal

**1.1 Atualizar Props**

```typescript
// Antes
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { useOrdensSemDataCarregamento } from "@/hooks/useOrdensSemDataCarregamento";

interface AdicionarOrdemCalendarioModalProps {
  ordemPreSelecionada?: OrdemCarregamento | null;
  onConfirm: (params: {
    ordemId: string;
    // ...
  }) => Promise<void>;
}

// Depois
import { OrdemCarregamentoUnificada } from "@/types/ordemCarregamentoUnificada";
import { useOrdensCarregamentoUnificadas } from "@/hooks/useOrdensCarregamentoUnificadas";

interface AdicionarOrdemCalendarioModalProps {
  ordemPreSelecionada?: OrdemCarregamentoUnificada | null;
  onConfirm: (params: {
    ordemId: string;
    fonte: 'ordens_carregamento' | 'instalacoes'; // NOVO: informar a fonte
    // ...
  }) => Promise<void>;
}
```

**1.2 Usar Hook Unificado**

```typescript
// Antes
const { ordens, isLoading: loadingOrdens, refetch } = useOrdensSemDataCarregamento();

// Depois
const { ordens: todasOrdens, isLoading: loadingOrdens } = useOrdensCarregamentoUnificadas();

// Filtrar apenas ordens SEM data de carregamento
const ordens = todasOrdens.filter(o => !o.data_carregamento);

// refetch não é necessário pois o hook unificado já tem real-time
```

**1.3 Atualizar Tipo do Estado**

```typescript
// Antes
const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemCarregamento | null>(null);

// Depois
const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemCarregamentoUnificada | null>(null);
```

**1.4 Passar a Fonte no Confirm**

```typescript
// No handleConfirm
await onConfirm({
  ordemId: ordemSelecionada.id,
  fonte: ordemSelecionada.fonte, // NOVO
  data_carregamento: format(dataSelecionada, "yyyy-MM-dd"),
  hora,
  tipo_carregamento: responsavelTipo,
  responsavel_carregamento_id: finalResponsavelId,
  responsavel_carregamento_nome: responsavelNome
});
```

**1.5 Verificar tipo_entrega**

```typescript
// Antes
const isEntrega = ordemSelecionada?.venda?.tipo_entrega === 'entrega';

// Depois (usando campo unificado)
const isEntrega = ordemSelecionada?.tipo_entrega === 'entrega';
```

---

### Parte 2: Atualizar OrdensCarregamentoDisponiveis

**2.1 Atualizar handleConfirmAgendar**

```typescript
// Atualizar interface de params para incluir fonte
const handleConfirmAgendar = async (params: {
  ordemId: string;
  fonte: 'ordens_carregamento' | 'instalacoes'; // NOVO
  data_carregamento: string;
  hora: string;
  tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro';
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string;
}) => {
  // Usar fonte do params em vez de ordemSelecionada
  const tabela = params.fonte === 'instalacoes' ? 'instalacoes' : 'ordens_carregamento';
  // ...
};
```

**2.2 Remover Cast**

```typescript
// Antes
<AdicionarOrdemCalendarioModal
  ordemPreSelecionada={ordemSelecionada as any}
/>

// Depois
<AdicionarOrdemCalendarioModal
  ordemPreSelecionada={ordemSelecionada}
/>
```

---

### Parte 3: Adicionar Badge de Tipo no Modal

Para diferenciar entregas de instalações na lista do modal:

```typescript
// Na lista de ordens dentro do modal
<Badge
  variant={ordem.tipo_entrega === 'entrega' ? 'default' : 'secondary'}
  className={cn(
    "text-xs shrink-0",
    ordem.tipo_entrega === 'instalacao' && "bg-orange-500/20 text-orange-600",
    ordem.tipo_entrega === 'manutencao' && "bg-purple-500/20 text-purple-600"
  )}
>
  {ordem.tipo_entrega === 'entrega' ? 'Entrega' : 
   ordem.tipo_entrega === 'manutencao' ? 'Manutenção' : 'Instalação'}
</Badge>
```

---

### Resultado Esperado

Após as correções:

1. **Modal "+"** exibirá tanto entregas quanto instalações pendentes de agendamento
2. **Tabela "Ordens Disponíveis"** funcionará corretamente ao clicar em "Agendar"
3. **Instalação #0099** aparecerá em ambos os locais com badge laranja "Instalação"
4. **Agendamento** salvará na tabela correta (`instalacoes` ou `ordens_carregamento`)

---

### Fluxo Corrigido

```text
Usuário clica em "+"
       │
       ▼
Modal abre com useOrdensCarregamentoUnificadas()
       │
       ▼
Lista mostra:
├── Entregas (ordens_carregamento) - Badge azul
├── Instalações (instalacoes) - Badge laranja
└── Manutenções (instalacoes) - Badge roxo
       │
       ▼
Seleciona ordem → onConfirm({ fonte: 'instalacoes' | 'ordens_carregamento' })
       │
       ▼
Salva na tabela correta
```

