

# Plano: Exibir Datas de Pagamento nas Listagens de Faturamento

## Objetivo

Adicionar duas colunas para exibir as datas dos dois métodos de pagamento cadastrados na venda, além de aumentar a largura da listagem para melhorar a visualização de todas as colunas.

---

## Contexto Técnico

O sistema permite até 2 métodos de pagamento por venda. Os dados de pagamento são armazenados na tabela `contas_receber`, com múltiplas parcelas por método. Para identificar as datas dos pagamentos:

- Cada parcela tem `metodo_pagamento` e `data_vencimento`
- Precisamos buscar a **primeira data de vencimento** de cada método de pagamento distinto por venda
- Se houver 2 métodos diferentes, exibimos as duas datas separadamente

---

## Alterações

### 1. Página `/direcao/faturamento` (FaturamentoDirecao.tsx)

**Query de Dados:**
- Adicionar busca de contas_receber para cada venda
- Extrair datas de pagamento por método

**Novas Colunas:**
```
| Data Pgto 1 | Data Pgto 2 |
| 29/01/26    | 15/02/26    |
```

**COLUNAS_DISPONIVEIS:**
```tsx
{ id: 'data_pgto_1', label: 'Data Pgto 1', defaultVisible: true },
{ id: 'data_pgto_2', label: 'Data Pgto 2', defaultVisible: true },
```

**Interface Venda - adicionar:**
```tsx
data_pagamento_1?: string | null;
data_pagamento_2?: string | null;
metodo_pagamento_1?: string | null;
metodo_pagamento_2?: string | null;
```

**renderCell - adicionar cases:**
```tsx
case 'data_pgto_1':
  return venda.data_pagamento_1 
    ? <span className="text-white/80">{format(new Date(venda.data_pagamento_1), 'dd/MM/yy')}</span>
    : <span className="text-white/30">-</span>;
case 'data_pgto_2':
  return venda.data_pagamento_2 
    ? <span className="text-white/80">{format(new Date(venda.data_pagamento_2), 'dd/MM/yy')}</span>
    : <span className="text-white/30">-</span>;
```

**Largura da Tabela:**
- Aumentar container para `max-w-[1600px]` ou usar `w-full` com overflow

---

### 2. Página `/administrativo/financeiro/faturamento/vendas` (FaturamentoVendasMinimalista.tsx)

Aplicar as **mesmas alterações**:

**Query fetchVendas:**
- Adicionar busca de contas_receber ou fazer query separada

**COLUNAS_DISPONIVEIS:**
```tsx
{ id: 'data_pgto_1', label: 'Data Pgto 1', defaultVisible: true },
{ id: 'data_pgto_2', label: 'Data Pgto 2', defaultVisible: true },
```

**Interface e renderCell:**
- Mesma lógica de FaturamentoDirecao

**Largura:**
- Ajustar container para acomodar novas colunas

---

## Estratégia de Busca de Dados

Para obter as datas de pagamento de cada venda, faremos uma query agregada:

```sql
SELECT 
  venda_id,
  metodo_pagamento,
  MIN(data_vencimento) as primeira_data
FROM contas_receber 
WHERE venda_id = ANY($1)
GROUP BY venda_id, metodo_pagamento
ORDER BY venda_id, MIN(data_vencimento)
```

Depois processamos no frontend:
```tsx
// Agrupar por venda_id
const pagamentosPorVenda = new Map<string, { data1?: string, data2?: string, metodo1?: string, metodo2?: string }>();

contasData.forEach(conta => {
  const existing = pagamentosPorVenda.get(conta.venda_id) || {};
  if (!existing.data1) {
    existing.data1 = conta.primeira_data;
    existing.metodo1 = conta.metodo_pagamento;
  } else if (!existing.data2 && conta.metodo_pagamento !== existing.metodo1) {
    existing.data2 = conta.primeira_data;
    existing.metodo2 = conta.metodo_pagamento;
  }
  pagamentosPorVenda.set(conta.venda_id, existing);
});
```

---

## Exibição das Colunas

```text
| ... | Data Pgto 1 | Data Pgto 2 | Valor | Lucro | Status |
|-----|-------------|-------------|-------|-------|--------|
| ... | 29/01/26    | 15/02/26    | R$ 5k | R$ 1k | Fatur. |
| ... | 01/02/26    | -           | R$ 3k | R$ 800| Pend.  |
```

- **Data Pgto 1**: Primeira data de vencimento do primeiro método
- **Data Pgto 2**: Primeira data de vencimento do segundo método (se houver)
- Se a venda tiver apenas 1 método, "Data Pgto 2" exibe "-"

---

## Ajuste de Largura das Listagens

### FaturamentoDirecao.tsx

```tsx
// Alterar o container da tabela
<div className="bg-primary/5 border border-primary/10 rounded-xl overflow-x-auto backdrop-blur-xl">
```

### FaturamentoVendasMinimalista.tsx

```tsx
// Aumentar largura do container principal
<div className="container mx-auto p-6 pt-20 space-y-6 max-w-[1600px]">

// Adicionar overflow-x-auto na tabela
<div className="rounded-md border border-white/10 overflow-x-auto">
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/direcao/FaturamentoDirecao.tsx` | Buscar contas_receber, adicionar colunas data_pgto_1/2, ajustar largura |
| `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` | Mesmas alterações |

---

## Impacto

- **Visibilidade**: Gestores visualizam rapidamente quando os pagamentos vencem
- **Decisões**: Facilita acompanhamento de fluxo de caixa
- **UX**: Tabela com scroll horizontal se necessário, mas todas as informações visíveis

