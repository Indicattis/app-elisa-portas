

## Plano: Corrigir Exibição de Instalações para Agendamento na Expedição

### Problema Identificado

A instalação #0099 (FERNANDO FIGUEIRO LTDA) não aparece na página `/logistica/expedicao` porque:

1. **Dados corretos no banco**: A instalação existe com `carregamento_concluido: false` e pedido em `etapa_atual: instalacoes`
2. **Componente desatualizado**: O `OrdensCarregamentoDisponiveis` busca apenas da tabela `ordens_carregamento`
3. **Hook correto existe**: O `useOrdensCarregamentoUnificadas` já foi criado para buscar de ambas as tabelas, mas não está sendo usado

### Solução

Atualizar o componente `OrdensCarregamentoDisponiveis` (e sua versão mobile) para usar o hook unificado `useOrdensCarregamentoUnificadas` que já busca corretamente de ambas as fontes.

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/expedicao/OrdensCarregamentoDisponiveis.tsx` | Modificar | Usar hook unificado e adaptar tipos |
| `src/components/expedicao/OrdensCarregamentoDisponiveisMobile.tsx` | Modificar | Usar hook unificado e adaptar tipos |
| `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx` | Verificar | Adaptar para aceitar tipo unificado se necessário |

---

### Parte 1: Modificar OrdensCarregamentoDisponiveis.tsx

**Antes (busca apenas ordens_carregamento):**
```typescript
const fetchOrdensDisponiveis = async () => {
  const { data, error } = await supabase
    .from("ordens_carregamento")
    .select(`...`)
    .is("data_carregamento", null)
    ...
}
```

**Depois (usar hook unificado):**
```typescript
import { useOrdensCarregamentoUnificadas, OrdemCarregamentoUnificada } from "@/hooks/useOrdensCarregamentoUnificadas";

export const OrdensCarregamentoDisponiveis = ({ onRefresh }) => {
  const { ordens, isLoading } = useOrdensCarregamentoUnificadas();
  
  // Filtrar apenas ordens SEM data de carregamento (disponíveis para agendamento)
  const ordensDisponiveis = ordens.filter(o => !o.data_carregamento);
  
  // ... resto do componente usando ordensDisponiveis
}
```

---

### Parte 2: Adaptar Lógica de Agendamento

O modal de agendamento (`AdicionarOrdemCalendarioModal`) precisa saber a `fonte` da ordem para atualizar a tabela correta:

```typescript
const handleConfirmAgendar = async (params) => {
  const tabela = ordemSelecionada.fonte === 'instalacoes' 
    ? "instalacoes" 
    : "ordens_carregamento";
  
  const { error } = await supabase
    .from(tabela)
    .update({
      data_carregamento: params.data_carregamento,
      hora_carregamento: params.hora,
      tipo_carregamento: params.tipo_carregamento,
      responsavel_carregamento_id: params.responsavel_carregamento_id,
      responsavel_carregamento_nome: params.responsavel_carregamento_nome,
      status: 'agendada',
      updated_at: new Date().toISOString()
    })
    .eq("id", params.ordemId);
  ...
}
```

---

### Parte 3: Adaptar Versão Mobile

O componente `OrdensCarregamentoDisponiveisMobile` também precisa da mesma atualização para usar o hook unificado.

---

### Parte 4: Adicionar Indicador Visual de Tipo

Para diferenciar entregas de instalações na tabela, adicionar badge visual:

```typescript
<td className="p-2">
  <Badge 
    variant={ordem.tipo_entrega === 'entrega' ? 'default' : 'secondary'} 
    className={cn(
      "text-xs",
      ordem.tipo_entrega === 'instalacao' && "bg-orange-500/20 text-orange-400 border-orange-500/30",
      ordem.tipo_entrega === 'manutencao' && "bg-purple-500/20 text-purple-400 border-purple-500/30"
    )}
  >
    {ordem.tipo_entrega === 'entrega' ? 'Entrega' : 
     ordem.tipo_entrega === 'manutencao' ? 'Manutenção' : 'Instalação'}
  </Badge>
</td>
```

---

### Resultado Esperado

Após a correção:

1. A instalação #0099 (FERNANDO FIGUEIRO LTDA) aparecerá na lista "Ordens Disponíveis para Agendamento"
2. O badge indicará que é uma "Instalação" (cor laranja)
3. Ao agendar, a data será salva na tabela `instalacoes` (não em `ordens_carregamento`)
4. O calendário de expedição exibirá a instalação agendada

---

### Fluxo Visual Corrigido

```text
INSTALAÇÃO #0099
├── pedido.etapa_atual = 'instalacoes'
├── carregamento_concluido = false
├── data_carregamento = null
│
└── APARECE EM:
    ├── /logistica/expedicao → "Ordens Disponíveis para Agendamento" ← SERÁ CORRIGIDO
    │
    └── Ao agendar → Atualiza tabela 'instalacoes' diretamente
```

