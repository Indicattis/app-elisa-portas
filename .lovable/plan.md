

# Corrigir calculo de lucro da pintura epoxi - dimensoes no campo `tamanho`

## Problema

Os produtos do tipo `pintura_epoxi` nao possuem os campos `altura` e `largura` preenchidos no banco de dados. As dimensoes estao armazenadas no campo `tamanho` como string no formato `"6.35x4.9"`. Por isso, a formula `((produto.altura || 0) * (produto.largura || 0)) * 25` sempre resulta em `0 * 0 * 25 = 0`.

## Solucao

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Alterar o calculo no useEffect (linhas 276-279) para extrair as dimensoes do campo `tamanho` quando `altura` e `largura` forem nulos:

```typescript
// Extrair dimensoes do campo tamanho (formato "6.35x4.9")
let altura = produto.altura || 0;
let largura = produto.largura || 0;

if ((!altura || !largura) && produto.tamanho) {
  const partes = produto.tamanho.split('x');
  if (partes.length === 2) {
    largura = parseFloat(partes[0]) || 0;
    altura = parseFloat(partes[1]) || 0;
  }
}

const lucroPintura = (altura * largura) * 25;
const custoCalculado = produto.valor_total - lucroPintura;
```

Para a venda em questao, isso resultara em: `(6.35 * 4.9) * 25 = 777.875`, arredondando para R$ 777,88.
