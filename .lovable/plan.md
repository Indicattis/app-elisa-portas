

# Plano: Atualizar Colunas das Tabelas de Produtos

## Resumo

Alterar as colunas exibidas nas tabelas de produtos da Fabrica e Almoxarifado, adicionando informacoes de estoque e valores, e ocultando campos administrativos.

## Colunas Solicitadas

**Exibir:**
- SKU/Nome
- Produto
- Estoque Minimo
- Estoque Maximo
- Estoque Atual
- Preco por Unidade
- Valor em Estoque (calculado: quantidade * custo_unitario)

**Ocultar:**
- Categoria
- Setor
- Pintura

## Alteracoes

### 1. ProdutosFabrica.tsx

**Antes (linhas 405-412):**
```
SKU | Produto | Categoria | Setor | Pintura
```

**Depois:**
```
SKU | Produto | Est. Min | Est. Max | Atual | Preco/Un | Valor Total
```

Atualizar TableHeader:
```typescript
<TableHeader>
  <TableRow className="border-white/10 hover:bg-transparent">
    <TableHead className="text-xs font-medium text-white/60 w-24">SKU</TableHead>
    <TableHead className="text-xs font-medium text-white/60">Produto</TableHead>
    <TableHead className="text-center text-xs font-medium text-white/60">Est. Min</TableHead>
    <TableHead className="text-center text-xs font-medium text-white/60">Est. Max</TableHead>
    <TableHead className="text-center text-xs font-medium text-white/60">Atual</TableHead>
    <TableHead className="text-right text-xs font-medium text-white/60">Preco/Un</TableHead>
    <TableHead className="text-right text-xs font-medium text-white/60">Valor Total</TableHead>
  </TableRow>
</TableHeader>
```

Atualizar TableBody (linhas 440-492):
```typescript
<TableCell className="text-xs font-mono text-white/40">
  {produto.sku || "-"}
</TableCell>
<TableCell>
  <div>
    <p className="text-sm font-medium text-white">{produto.nome_produto}</p>
    {produto.descricao_produto && (
      <p className="text-xs text-white/50">{produto.descricao_produto}</p>
    )}
  </div>
</TableCell>
<TableCell className="text-center text-white/80">
  {produto.quantidade_ideal || 0}
</TableCell>
<TableCell className="text-center text-white/80">
  {produto.quantidade_maxima || 0}
</TableCell>
<TableCell className="text-center">
  <Badge className={
    produto.quantidade < (produto.quantidade_ideal || 0)
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : "bg-green-500/20 text-green-400 border-green-500/30"
  }>
    {produto.quantidade}
  </Badge>
</TableCell>
<TableCell className="text-right text-white/80">
  {formatCurrency(produto.custo_unitario)}
</TableCell>
<TableCell className="text-right font-medium text-white">
  {formatCurrency(produto.quantidade * produto.custo_unitario)}
</TableCell>
```

Importar formatCurrency:
```typescript
import { formatCurrency } from "@/lib/utils";
```

### 2. ProdutosAlmoxarifado.tsx

A tabela do Almoxarifado ja possui as colunas corretas:
- Nome (produto)
- Qtd. Min. (estoque minimo)
- Qtd. Max. (estoque maximo)
- Em Estoque (atual)
- Custo (preco por unidade)
- Total (valor em estoque)

Nao possui colunas de categoria, setor ou pintura para remover.

**Pequeno ajuste:** Remover colunas menos relevantes para manter consistencia com Fabrica:
- Remover: Fornecedor, Ultima Conf., Un.
- Manter: Nome, Qtd. Min, Qtd. Max, Em Estoque, Custo, Total, Acoes

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/direcao/estoque/ProdutosFabrica.tsx` | Substituir colunas da tabela |
| `src/pages/direcao/estoque/ProdutosAlmoxarifado.tsx` | Remover colunas extras para consistencia |

## Campos Utilizados

**Fabrica (estoque):**
- `quantidade_ideal` -> Estoque Minimo
- `quantidade_maxima` -> Estoque Maximo  
- `quantidade` -> Estoque Atual
- `custo_unitario` -> Preco por Unidade
- `quantidade * custo_unitario` -> Valor Total

**Almoxarifado:**
- `quantidade_minima` -> Estoque Minimo
- `quantidade_maxima` -> Estoque Maximo
- `quantidade_estoque` -> Estoque Atual
- `custo` -> Preco por Unidade
- `total_estoque` -> Valor Total (ja calculado no hook)

