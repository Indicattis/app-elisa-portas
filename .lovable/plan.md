
# Plano: Exibir Forma de Pagamento nas Listagens

## Objetivo

Adicionar a exibição da forma de pagamento (coluna `metodo_pagamento`) nas listagens de vendas das seguintes páginas:

1. `/vendas/minhas-vendas` - MinhasVendas.tsx
2. `/direcao/vendas` - VendasDirecao.tsx
3. `/logistica/instalacoes/ordens-instalacoes` - OrdensInstalacoesLogistica.tsx
4. `/logistica/expedicao` - ExpedicaoMinimalista.tsx
5. `/administrativo/financeiro/faturamento/vendas` - FaturamentoVendasMinimalista.tsx

---

## Mapeamento de Valores

O campo `metodo_pagamento` possui os seguintes valores no banco de dados:

| Valor no Banco | Label Exibido |
|----------------|---------------|
| `boleto` | Boleto |
| `a_vista` | À Vista |
| `cartao_credito` | Cartão |
| `dinheiro` | Dinheiro |
| `null` ou vazio | - |

---

## Alteracoes por Pagina

### 1. `/vendas/minhas-vendas` (MinhasVendas.tsx)

**Alteracoes:**
- Adicionar `metodo_pagamento` na query do Supabase
- Adicionar nova opcao em `COLUNAS_DISPONIVEIS`
- Adicionar case no `renderCell` para exibir a forma de pagamento

```tsx
// COLUNAS_DISPONIVEIS - adicionar:
{ id: 'pagamento', label: 'Pagamento', defaultVisible: true },

// Query - adicionar campo:
metodo_pagamento,

// renderCell - adicionar case:
case 'pagamento':
  return getFormaPagamentoLabel(venda.metodo_pagamento);
```

---

### 2. `/direcao/vendas` (VendasDirecao.tsx)

**Alteracoes:**
- Adicionar nova opcao em `COLUNAS_DISPONIVEIS`
- Adicionar case no `renderCell` para exibir pagamento
- A query do hook `useVendas` ja traz todos os campos necessarios

```tsx
// COLUNAS_DISPONIVEIS - adicionar:
{ id: 'pagamento', label: 'Pagamento', defaultVisible: true },

// renderCell - adicionar case:
case 'pagamento':
  return <span className={textClass}>{getFormaPagamentoLabel(venda.metodo_pagamento)}</span>;
```

---

### 3. `/logistica/instalacoes/ordens-instalacoes` (OrdensInstalacoesLogistica.tsx)

**Alteracoes:**
- Modificar o hook `useOrdensInstalacao` para buscar `metodo_pagamento` da venda
- Atualizar o componente `OrdemInstalacaoRow` para exibir a forma de pagamento
- Ajustar o grid-template-columns para acomodar a nova coluna

```tsx
// OrdemInstalacaoRow - ajustar grid e adicionar coluna:
style={{ 
  gridTemplateColumns: "28px 70px 1fr 100px 60px 80px 80px 50px" 
}}

// Adicionar coluna de pagamento no meio
```

---

### 4. `/logistica/expedicao` (ExpedicaoMinimalista.tsx)

Esta pagina utiliza componentes de calendario (CalendarioMensalExpedicaoDesktop, etc.) que exibem cards de ordens. A forma de pagamento deve ser exibida nos detalhes da ordem.

**Alteracoes:**
- Modificar o hook `useOrdensCarregamentoCalendario` para buscar `metodo_pagamento`
- Atualizar o componente `OrdemCarregamentoDetails` para exibir a forma de pagamento nos detalhes

---

### 5. `/administrativo/financeiro/faturamento/vendas` (FaturamentoVendasMinimalista.tsx)

**Alteracoes:**
- Adicionar `metodo_pagamento` na query fetchVendas
- Adicionar nova coluna em `COLUNAS_DISPONIVEIS`
- Adicionar case no `renderCell`

```tsx
// COLUNAS_DISPONIVEIS - adicionar:
{ id: 'pagamento', label: 'Pagamento', defaultVisible: true },

// fetchVendas - adicionar campo na query:
metodo_pagamento,

// renderCell - adicionar case
```

---

## Funcao Utilitaria Compartilhada

Criar uma funcao utilitaria para mapear valores de metodo de pagamento para labels amigaveis:

```tsx
// src/utils/formatters.ts (ou arquivo existente)
export const getFormaPagamentoLabel = (metodo: string | null | undefined): string => {
  if (!metodo) return '-';
  
  const labels: Record<string, string> = {
    'boleto': 'Boleto',
    'a_vista': 'À Vista',
    'cartao_credito': 'Cartão',
    'dinheiro': 'Dinheiro',
  };
  
  return labels[metodo] || metodo.replace('_', ' ');
};
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/utils/formatters.ts` | Criar funcao `getFormaPagamentoLabel` |
| `src/pages/vendas/MinhasVendas.tsx` | Adicionar coluna de pagamento na tabela |
| `src/pages/direcao/VendasDirecao.tsx` | Adicionar coluna de pagamento na tabela |
| `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` | Adicionar coluna de pagamento na tabela |
| `src/hooks/useOrdensInstalacao.ts` | Adicionar `metodo_pagamento` na query da venda |
| `src/components/instalacoes/OrdemInstalacaoRow.tsx` | Adicionar coluna de pagamento |
| `src/hooks/useOrdensCarregamentoCalendario.ts` | Adicionar `metodo_pagamento` na query da venda |
| `src/components/expedicao/OrdemCarregamentoDetails.tsx` | Exibir forma de pagamento nos detalhes |

---

## Resultado Visual Esperado

```text
ANTES (tabela de vendas):
| Data | Cliente | Cidade | Valor | Status |
|------|---------|--------|-------|--------|

DEPOIS (tabela de vendas):
| Data | Cliente | Cidade | Pagamento | Valor | Status |
|------|---------|--------|-----------|-------|--------|
| 29/01 | João S. | Curitiba | Boleto | R$ 2.500 | Prod. |
| 28/01 | Maria L. | Porto Alegre | Cartão | R$ 3.200 | Aguard. |
```

---

## Impacto

- **Visibilidade**: Gestores e vendedores podem ver rapidamente a forma de pagamento
- **Decisoes**: Facilita identificar vendas por tipo de pagamento para cobrancas
- **Consistencia**: Mesma informacao disponivel em todas as listagens relevantes
