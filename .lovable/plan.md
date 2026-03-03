
# Adicionar tag de % margem em cada coluna da tabela de Faturamento/Lucro

## O que será feito

Na primeira seção (tabela com Faturamento e Lucro), adicionar uma terceira linha "Margem %" que mostra a porcentagem de margem de cada coluna: `(lucro / faturamento) * 100`.

Alternativamente, adicionar a porcentagem como uma tag/badge inline na própria linha de Lucro, ao lado do valor.

## Alteração em `DREMesDirecao.tsx`

Na tabela de faturamento/lucro (linhas 387-412), adicionar uma nova linha `<tr>` após a linha de Lucro:

```
<tr>
  <td>Margem %</td>
  {columns.map(col => {
    const perc = faturamento[col.key] > 0 
      ? (lucro[col.key] / faturamento[col.key]) * 100 
      : 0;
    return <td>{perc.toFixed(1)}%</td>;
  })}
</tr>
```

Cada célula exibirá a porcentagem com 1 casa decimal, cor condicional (verde para positivo, vermelho para negativo), e uma tag/badge estilizada com `rounded-full bg-white/10 px-2 py-0.5 text-xs`.

## Arquivo alterado
- `src/pages/direcao/DREMesDirecao.tsx` (linhas ~399-412, adicionar `<tr>` após linha de Lucro)
