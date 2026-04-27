## Problema

Na venda `453f0691...` foi aplicado **5% de desconto** no produto "Meia cana lisa" (`tipo_desconto = 'percentual'`, `desconto_percentual = 5`, `desconto_valor = 0`).

Os indicadores **Desc. Cartão / Desc. Gelo / Luan-Alana** aparecem zerados porque o cálculo desses tiers em `FaturamentoVendaMinimalista.tsx` soma apenas o campo `desconto_valor`, ignorando descontos do tipo percentual.

## Causa técnica

Em `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`:

- Linha 856 — `totalDescontos`: `produtos.reduce((acc, p) => acc + (p.desconto_valor || 0), 0)` → 0 quando o desconto é percentual.
- Linha 867 — dentro de `descontoTiers`: idêntico, soma apenas `desconto_valor` para obter `totalDesc`, então todos os tiers ficam em 0.

A variável `totalDescontosCalc` (linha 822) já faz o cálculo correto convertendo percentual em valor — basta reaproveitá-la.

## Correção

Em `FaturamentoVendaMinimalista.tsx`:

1. Substituir o cálculo de `totalDescontos` (linha 856) por `totalDescontosCalc` (que já considera percentual + valor).
2. No bloco `descontoTiers` (linha 866), trocar a soma direta de `desconto_valor` por uma soma que, para cada produto, calcule:
   - Se `tipo_desconto === 'percentual'` e `desconto_percentual > 0`: `base * (desconto_percentual/100)` onde `base = (valor_produto + valor_pintura + valor_instalacao) * quantidade`.
   - Senão: `Math.max(0, desconto_valor)`.
3. Manter o tratamento de créditos (`desconto_valor < 0`) como está, já que crédito não usa percentual.

Resultado: os cards "Desc. Cartão", "Desc. Gelo", "Luan/Alana" e "Excedente >X%" passarão a refletir corretamente os descontos percentuais (no caso desta venda, R$ 19,25 distribuídos no tier "Cartão" / "Gelo" conforme regras de pagamento e venda presencial).

## Verificação pós-fix

Recarregar `/administrativo/financeiro/faturamento/453f0691-bb72-4236-a696-a927fa287800` e confirmar que a soma dos tiers = 5% × (55 × 7) = R$ 19,25.
