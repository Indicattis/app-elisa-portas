

# Corrigir dupla contagem no faturamento de Portas no DRE

## Problema identificado

O campo `valor_total_sem_frete` na tabela `produtos_vendas` é calculado por um trigger do banco como:

```
valor_base = (valor_produto + valor_pintura + valor_instalacao) × quantidade
valor_total_sem_frete = valor_base - desconto
```

Ou seja, `valor_total_sem_frete` **já inclui** `valor_instalacao` e `valor_pintura`. No DRE, esse valor é usado para a coluna "Portas", enquanto instalação e pintura são contabilizadas separadamente — gerando dupla contagem.

## Solução

No `DREMesDirecao.tsx`, para produtos do tipo `porta_enrolar` e `porta_social`, usar `valor_produto` (multiplicado pela quantidade e deduzido o desconto proporcional) em vez de `valor_total_sem_frete` para a coluna "Portas". Isso evita incluir instalação e pintura no valor das portas.

### Alterações em `DREMesDirecao.tsx`

1. **Adicionar campos na query**: incluir `valor_produto`, `valor_instalacao`, `valor_pintura`, `quantidade`, `desconto_percentual`, `desconto_valor`, `tipo_desconto` no select de `produtos_vendas`.

2. **Separar faturamento corretamente** no `forEach`:
   - Para portas: usar `valor_produto × quantidade` (com desconto proporcional) — sem incluir pintura/instalação.
   - Para pintura: somar `valor_pintura × quantidade` dos produtos de porta (já que `pintura_epoxi` pode não ter registros separados em todos os casos, mas o campo existe no produto de porta).
   - Instalações e demais categorias: manter lógica atual (instalações já vêm da tabela `vendas`).

3. **Alternativa mais simples** (se pintura e instalação já são contabilizadas separadamente via suas próprias linhas/colunas): para portas, calcular apenas `valor_produto * quantidade - desconto_proporcional` em vez de `valor_total_sem_frete`.

## Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx`

