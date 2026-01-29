
# Plano: Pagamento na Entrega para Ordens de Instalação

## Resumo

Adicionar um checkbox na seção de pagamentos da venda para sinalizar que o pagamento será feito na entrega/instalação. Quando uma ordem de instalação for criada, ela armazenará o valor a ser pago e o método de pagamento.

---

## Arquitetura da Solução

A tabela `vendas` já possui a coluna `pagamento_na_entrega` (boolean), mas a tabela `instalacoes` precisa de novas colunas para armazenar os detalhes do pagamento.

---

## 1. Migração do Banco de Dados

**Adicionar colunas na tabela `instalacoes`:**

```sql
ALTER TABLE instalacoes 
ADD COLUMN valor_pagamento_entrega NUMERIC DEFAULT 0,
ADD COLUMN metodo_pagamento_entrega TEXT;
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `valor_pagamento_entrega` | NUMERIC | Valor a ser cobrado na entrega |
| `metodo_pagamento_entrega` | TEXT | Método de pagamento (boleto, cartao_credito, a_vista, dinheiro) |

---

## 2. Interface: PagamentoSection.tsx

**Adicionar novo campo ao `PagamentoData`:**

```typescript
export interface PagamentoData {
  usar_dois_metodos: boolean;
  metodos: [MetodoPagamento, MetodoPagamento];
  pagamento_na_entrega: boolean;  // NOVO
}
```

**Adicionar checkbox no componente:**

Abaixo do toggle "Usar 2 formas de pagamento", adicionar um checkbox sofisticado:

```text
┌─────────────────────────────────────────────────────┐
│ ☑ Pagamento será feito na entrega/instalação        │
│   O valor total será cobrado no momento da entrega  │
└─────────────────────────────────────────────────────┘
```

**Comportamento:**
- Quando marcado, os campos de método de pagamento ficam opcionais
- A seção de pagamento fica simplificada (apenas escolha do método previsto)
- O resumo mostra "A pagar na entrega: R$ X.XXX,XX"

---

## 3. Página de Nova Venda: VendaNovaMinimalista.tsx

**Atualizar inicialização do `pagamentoData`:**

```typescript
const [pagamentoData, setPagamentoData] = useState<PagamentoData>(createEmptyPagamentoData());
// createEmptyPagamentoData() já retornará pagamento_na_entrega: false
```

**Passar dados para `createVenda`:**

O `pagamentoData.pagamento_na_entrega` já estará no objeto passado.

---

## 4. Hook useVendas.ts: Salvar na Venda

**Na função `createVenda`:**

```typescript
// Ao inserir a venda
const { data: venda } = await supabase
  .from('vendas')
  .insert({
    ...vendaData,
    pagamento_na_entrega: pagamentoData.pagamento_na_entrega,
    metodo_pagamento: pagamentoData.metodos[0]?.tipo || '',
    // ... outros campos
  })
```

---

## 5. Hooks de Criação de Instalação

**Arquivos afetados:**
- `src/hooks/usePedidoCreation.ts` (para manutenções)
- `src/hooks/usePedidosEtapas.ts` (para instalações normais)
- `src/components/instalacoes/CalendarioMensalDesktop.tsx` (criação manual)

**Lógica:**

Ao criar uma instalação, buscar dados da venda e verificar se `pagamento_na_entrega = true`:

```typescript
// Ao inserir instalação
const { data: venda } = await supabase
  .from('vendas')
  .select('pagamento_na_entrega, valor_venda, metodo_pagamento')
  .eq('id', vendaId)
  .single();

await supabase.from('instalacoes').insert({
  // ... campos existentes
  valor_pagamento_entrega: venda.pagamento_na_entrega ? venda.valor_venda : 0,
  metodo_pagamento_entrega: venda.pagamento_na_entrega ? venda.metodo_pagamento : null,
});
```

---

## 6. Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| **Banco de Dados** | Adicionar `valor_pagamento_entrega` e `metodo_pagamento_entrega` em `instalacoes` |
| `src/components/vendas/PagamentoSection.tsx` | Adicionar checkbox "Pagamento na entrega" e atualizar interface |
| `src/hooks/useVendas.ts` | Passar `pagamento_na_entrega` ao criar venda |
| `src/hooks/usePedidoCreation.ts` | Copiar dados de pagamento ao criar instalação |
| `src/hooks/usePedidosEtapas.ts` | Copiar dados de pagamento ao criar instalação |
| `src/components/instalacoes/CalendarioMensalDesktop.tsx` | Copiar dados de pagamento ao criar instalação manual |

---

## Fluxo do Usuário

```text
1. Vendedor abre /vendas/minhas-vendas/nova
2. Preenche dados do cliente e produtos
3. Na seção "Forma de Pagamento":
   - Marca "Pagamento será feito na entrega"
   - Seleciona o método previsto (boleto, cartão, dinheiro, etc.)
4. Finaliza a venda
5. Sistema salva a venda com pagamento_na_entrega = true
6. Quando o pedido avança para instalação:
   - O sistema cria a ordem de instalação
   - Copia o valor total e método para a ordem
7. Instalador visualiza na ordem: "A receber: R$ X.XXX,XX via [Método]"
```
