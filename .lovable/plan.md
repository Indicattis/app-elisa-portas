

## Corrigir cálculo da bonificação percentual

A bonificação percentual está sendo calculada como `total × (valor / 10)`, tratando o valor como décimos. Mas no cadastro/exibição (`MetasVendasDirecao.tsx`) o valor é tratado como percentual direto (`+0.3%`). O cálculo correto deve dividir por 100.

### Exemplo
- Tier 1 da Daiane: `bonificacao_valor = 0.3` (= 0,3%)
- Total vendido: R$ 179.330,42
- Esperado: 179.330,42 × (0,3 / 100) = **R$ 537,99**
- Atual (errado): 179.330,42 × (0,3 / 10) = R$ 5.379,91

### Mudança

**`src/hooks/useProgressoMetasVendas.ts`** — função `calcularBonificacao`:

```ts
// antes
return total * (Number(tier.bonificacao_valor) / 10);
// depois
return total * (Number(tier.bonificacao_valor) / 100);
```

Atualizar também o comentário acima da linha para refletir a regra correta (valor armazenado é a porcentagem, ex.: `0.3` ⇒ 0,3%).

### Fora de escopo

- Formulário de cadastro de tiers (já trata o valor como percentual).
- Exibição em `MetasVendasDirecao.tsx` (já correta).
- Bonificações do tipo `fixo` (continuam retornando o valor cheio quando o tier é atingido).

### Arquivos

- `src/hooks/useProgressoMetasVendas.ts` (editar)

