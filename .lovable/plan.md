

# Corrigir acrescimo nao incluido nas parcelas de pagamento

## Problema
O `valorTotalMemo` calculado na pagina de nova venda (linha 261-268 de `VendaNovaMinimalista.tsx`) soma apenas os creditos por produto (`p.valor_credito`) mas NAO inclui o credito a nivel de venda (`valorCredito` state). Isso faz com que o `PagamentoSection` receba um valor total sem o acrescimo, gerando parcelas com valores incorretos.

Enquanto isso, o backend em `useVendas.ts` (linha 198) calcula corretamente: `valor_total_venda = totais.valor_total + valorCreditoVenda + valor_frete`. Ha uma inconsistencia entre frontend e backend.

## Solucao
Incluir `valorCredito` (credito a nivel de venda) no calculo de `valorTotalMemo`.

## Mudanca

**Arquivo: `src/pages/vendas/VendaNovaMinimalista.tsx`**

Alterar o `useMemo` do `valorTotalMemo` (linhas 261-268) de:

```typescript
const valorTotalMemo = useMemo(() => {
  return portas.reduce((acc, p) => {
    const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
    const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
    const credito = (p.valor_credito || 0) * (p.quantidade || 1);
    return acc + valorBase - desconto + credito;
  }, 0) + (formData.valor_frete || 0);
}, [portas, formData.valor_frete]);
```

Para:

```typescript
const valorTotalMemo = useMemo(() => {
  return portas.reduce((acc, p) => {
    const valorBase = (p.valor_produto + p.valor_pintura + p.valor_instalacao) * (p.quantidade || 1);
    const desconto = p.tipo_desconto === 'valor' ? (p.desconto_valor || 0) : valorBase * ((p.desconto_percentual || 0) / 100);
    const credito = (p.valor_credito || 0) * (p.quantidade || 1);
    return acc + valorBase - desconto + credito;
  }, 0) + (formData.valor_frete || 0) + valorCredito;
}, [portas, formData.valor_frete, valorCredito]);
```

A unica diferenca e adicionar `+ valorCredito` ao final da soma e incluir `valorCredito` nas dependencias do `useMemo`.

Isso garante que o `PagamentoSection` receba o valor total correto (incluindo o acrescimo) e as parcelas sejam calculadas com o valor correto.

### Arquivo envolvido
- `src/pages/vendas/VendaNovaMinimalista.tsx` (1 linha alterada)
