
# Plano: Ajustar Formulário de Metas com Data de Vigência

## Objetivo

Melhorar o formulário de criação/edição de metas para permitir definir data de início e término (período de vigência), garantindo que o progresso só seja contabilizado dentro desse período.

---

## Alterações Necessárias

### 1. Atualizar MetaDialog - Adicionar Data de Início

O formulário atual define `data_inicio` como a data atual automaticamente. Precisamos permitir que o usuário escolha a data de início.

| Arquivo | Alteração |
|---------|-----------|
| `src/components/metas/MetaDialog.tsx` | Adicionar campo de data de início, melhorar labels e unidades |

**Mudanças no formulário:**
- Adicionar estado `dataInicio` (novo campo)
- Adicionar input de data para início da vigência
- Melhorar texto descritivo das unidades por tipo de meta
- Validar que data de término seja posterior à data de início

### 2. Atualizar Cálculo de Progresso

O progresso atualmente considera o mês inteiro. Precisamos ajustar para considerar apenas o período de vigência da meta.

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/MetasColaboradorIndividual.tsx` | Buscar desempenho por período de cada meta individual |

**Alternativas de implementação:**

**Opção A (Simples):** Manter busca mensal e filtrar no frontend
- Menos chamadas ao banco
- Funciona bem para metas do mês atual

**Opção B (Precisa):** Criar hook que busca desempenho por meta
- Mais preciso para metas que cruzam meses
- Requer mais chamadas RPC

Recomendo **Opção A** inicialmente por simplicidade.

---

## Detalhes Técnicos

### Unidades por Tipo de Meta (já corretas, apenas documentando)

| Tipo | Unidade | Descrição do Input |
|------|---------|-------------------|
| **Solda** | Portas | Número de portas de enrolar produzidas |
| **Perfiladeira** | Metros | Metragem linear (m) |
| **Separação** | Itens | Número de linhas/itens separados |
| **Qualidade** | Pedidos | Número de pedidos inspecionados |
| **Pintura** | m² | Metros quadrados pintados |
| **Carregamento** | Pedidos | Número de pedidos carregados |

### Campos do Formulário (Após Alteração)

```text
┌─────────────────────────────────────────────┐
│ Nova Meta / Editar Meta                     │
├─────────────────────────────────────────────┤
│ Tipo de Meta                                │
│ [ Solda ▼ ]                                 │
│                                             │
│ Valor da Meta *                             │
│ [ 100           ]                           │
│ "Quantidade de portas"                      │
│                                             │
│ Período de Vigência                         │
│ De:  [ 01/02/2026 ]  Até: [ 28/02/2026 ]   │
│                                             │
│ Recompensa (R$)                             │
│ [ 150,00        ]                           │
│                                             │
│              [ Cancelar ] [ Criar Meta ]    │
└─────────────────────────────────────────────┘
```

---

## Código: MetaDialog.tsx Atualizado

**Novos estados:**
```tsx
const [dataInicio, setDataInicio] = useState("");
```

**useEffect atualizado:**
```tsx
useEffect(() => {
  if (metaParaEditar) {
    setTipoMeta(metaParaEditar.tipo_meta);
    setValorMeta(metaParaEditar.valor_meta.toString());
    setDataInicio(metaParaEditar.data_inicio);  // Nova linha
    setDataTermino(metaParaEditar.data_termino);
    setRecompensaValor(metaParaEditar.recompensa_valor.toString());
  } else {
    setTipoMeta("solda");
    setValorMeta("");
    setDataInicio(new Date().toISOString().split("T")[0]);  // Padrão: hoje
    setDataTermino("");
    setRecompensaValor("");
  }
}, [metaParaEditar, open]);
```

**Labels de unidades melhoradas:**
```tsx
const getUnidadeDescricao = (tipo: string) => {
  switch(tipo) {
    case "solda": return "Quantidade de portas";
    case "perfiladeira": return "Metros lineares (m)";
    case "separacao": return "Quantidade de itens/linhas";
    case "qualidade": return "Quantidade de pedidos";
    case "pintura": return "Metros quadrados (m²)";
    case "carregamento": return "Quantidade de pedidos";
    default: return "Quantidade";
  }
};
```

**Novo campo de data de início:**
```tsx
<div className="grid grid-cols-2 gap-3">
  <div className="space-y-2">
    <Label>Data de Início *</Label>
    <Input
      type="date"
      value={dataInicio}
      onChange={(e) => setDataInicio(e.target.value)}
    />
  </div>
  <div className="space-y-2">
    <Label>Data de Término *</Label>
    <Input
      type="date"
      value={dataTermino}
      onChange={(e) => setDataTermino(e.target.value)}
      min={dataInicio}
    />
  </div>
</div>
```

---

## Código: MetaCard.tsx - Exibir Período

Atualizar para mostrar o período de vigência completo:

```tsx
<div className="flex items-center gap-1 text-muted-foreground">
  <Calendar className="h-3 w-3" />
  <span>
    {format(new Date(meta.data_inicio), "dd/MM")} - {format(new Date(meta.data_termino), "dd/MM")}
  </span>
</div>
```

---

## Arquivos a Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/metas/MetaDialog.tsx` | Editar | Adicionar campo data_inicio, melhorar UX |
| `src/components/metas/MetaCard.tsx` | Editar | Exibir período de vigência |

---

## Validações

1. Data de término deve ser >= data de início
2. Campo de recompensa aceita valores decimais (já funciona)
3. Valor da meta é obrigatório

---

## Resultado Esperado

- Metas com período de vigência definido (início e término)
- Unidades claras para cada tipo de meta
- Recompensa em valor R$ (já implementado)
- Cards exibindo o período de vigência
- Progresso calculado apenas dentro do período da meta
