

## Diagnóstico: Venda faturada aparece como "pendente"

### Causa raiz

A venda `c3c2400b...` tem:
- `frete_aprovado = true`
- 1 produto com `faturamento = true`
- **`custo_total = 0`**

Na página de faturamento (`FaturamentoEdit` e `FaturamentoVendaMinimalista`), a lógica é:
```
vendaFaturada = todosProdutosFaturados && frete_aprovado
```
→ Resultado: **faturada** ✓

Porém, em `VendasNaoFaturadasHistorico.tsx` (linha 105-106), a lógica é:
```
temCustoTotal = (custo_total || 0) > 0
if (!freteAprovado || !temCustoTotal) return true  // ← trata como NÃO faturada
```

Como `custo_total = 0`, a venda é incluída na lista de "não faturadas" mesmo estando corretamente faturada. Isso é um bug — custo zero é válido (ex: adicionais sem custo de produção).

Adicionalmente, em `FaturamentoDirecao.tsx` (linha 159):
```
if (portas.length === 0) return false
```
Isso usa `portas` (alias de `produtos_vendas`) — se o produto for do tipo "adicional", ainda conta, então esse caminho está ok.

### Correção

**Arquivo**: `src/components/faturamento/VendasNaoFaturadasHistorico.tsx`

Remover a checagem de `temCustoTotal` da lógica de filtro. A condição correta para "não faturada" deve ser consistente com o resto do sistema:

```
// Antes (bugado):
const freteAprovado = venda.frete_aprovado === true;
const temCustoTotal = (venda.custo_total || 0) > 0;
if (!freteAprovado || !temCustoTotal) return true;
return !portas.every(p => p.faturamento === true);

// Depois (corrigido):
const freteAprovado = venda.frete_aprovado === true;
const todosFaturados = portas.every(p => p.faturamento === true);
return !(freteAprovado && todosFaturados);
```

Isso alinha a lógica com `FaturamentoVendaMinimalista.tsx` e `useFaturamento.ts`, onde faturada = todos produtos faturados + frete aprovado.

### Arquivos afetados
- **Editar**: `src/components/faturamento/VendasNaoFaturadasHistorico.tsx` (remover checagem de `temCustoTotal`)

