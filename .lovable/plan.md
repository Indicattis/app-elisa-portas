## Problema

Na venda `453f0691...` foram cadastradas 2 formas de pagamento (R$ 200 + R$ 185,75 = R$ 385,75 + frete). Porém, na seção "Forma de Pagamento" do faturamento aparece apenas 1 método (À Vista), com a opção "Usar dois métodos" desativada.

## Causa técnica

Em `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` (linhas 347-391), o `useEffect` que hidrata `pagamentoData` decide se há 2 métodos com base nestas colunas da tabela `vendas`:

```ts
const usarDois = !!(venda.valor_entrada > 0 && venda.valor_a_receber > 0);
```

Mas no banco essa venda tem:
- `valor_entrada = 0`
- `valor_a_receber = 465,75`
- `metodo_pagamento = 'a_vista'`
- `forma_pagamento = 'a_vista'`

Ou seja, **o cadastro original em `/vendas/minhas-vendas/nova` (e a "finalização" em `MinhasVendasEditar.tsx` linha 528-537) não persistiu o split de pagamentos** nas colunas `valor_entrada` / `valor_a_receber` / segundo método. As parcelas reais ficaram apenas em `contas_receber` (2 linhas: R$ 200 paga em 27/04 + R$ 185 a vencer em 30/04, ambas marcadas como `a_vista`).

Como a fonte da verdade dos pagamentos da venda (após cadastro) é `contas_receber`, o card "Forma de Pagamento" precisa derivar de lá — não só das colunas escalares de `vendas`.

## Correção

Em `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`, alterar o `useEffect` de hidratação (linhas 347-391) para:

1. Esperar `contasReceber` carregar junto com `venda` (adicionar `contasReceber` às dependências, ou rodar quando `contasReceber.length > 0`).
2. **Agrupar `contasReceber` por `metodo_pagamento`** e somar `valor_parcela` de cada grupo.
3. Decidir os métodos exibidos a partir desses grupos:
   - **0 grupos** → fallback ao comportamento atual (usa colunas da venda).
   - **1 grupo com >1 parcela do mesmo método** → 1 método único; `parcelas_cartao`/`parcelas_boleto` = nº de parcelas do grupo; `valor` = soma do grupo.
   - **1 grupo "a_vista"/"dinheiro" com 2+ parcelas de valores distintos** (caso desta venda) → tratar como `usar_dois_metodos = true`, com `metodo1.valor` = 1ª parcela e `metodo2.valor` = soma das demais (ambos com tipo `a_vista`). Alternativa mais simples e correta: sempre que houver ≥ 2 parcelas e a soma não for divisível em iguais, considerar split.
   - **2 grupos distintos** → `usar_dois_metodos = true`; método 1 = grupo cuja primeira parcela tem `data_vencimento` mais antiga (entrada), método 2 = o outro (saldo). Para cada grupo, `parcelas_*` = `count` do grupo e `valor` = soma.
   - **3+ grupos** → exibir os 2 grupos de maior valor e mostrar aviso textual ("Esta venda possui mais de 2 métodos de pagamento; ajuste manual recomendado.").
4. Em cada método, popular também: `data_pagamento` = `data_vencimento` da 1ª parcela do grupo, `empresa_receptora_id` = da 1ª parcela do grupo, `intervalo_boletos` = diferença em dias entre 1ª e 2ª parcela quando aplicável, `ja_pago` = todas pagas do grupo.

Isso faz a seção "Forma de Pagamento" refletir fielmente as parcelas reais já lançadas em `contas_receber`, inclusive para o caso desta venda (2 parcelas À Vista — R$ 200 + R$ 185,75).

## Verificação pós-fix

Recarregar `/administrativo/financeiro/faturamento/453f0691-bb72-4236-a696-a927fa287800`:
- Toggle "Usar dois métodos" deve aparecer ativo.
- Método 1: À Vista, R$ 200,00, 27/04/2026.
- Método 2: À Vista, R$ 185,75 (ou conforme valor real), 30/04/2026.
- Nenhuma alteração deve ser disparada nas colunas da venda até o usuário clicar em "Salvar Forma de Pagamento" (preserva `consolidarVendaFromPagamento`).

## Observação adicional (fora do escopo)

O fluxo de cadastro em `MinhasVendasEditar.tsx` (linhas 528-537) também não persiste `valor_entrada`/`metodo_pagamento` corretamente quando o vendedor escolhe 2 métodos. Posso corrigir isso depois — esta correção foca apenas em fazer o faturamento ler corretamente o estado atual.
