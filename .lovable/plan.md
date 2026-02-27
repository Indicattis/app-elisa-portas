

# Adicionar linhas de totais na tabela de produtos

## O que sera feito

Adicionar duas linhas de totalizacao apos a linha do Frete na tabela de produtos em `FaturamentoVendaMinimalista.tsx`:

1. **Linha "Total Produtos"** -- soma do `valor_total` de todos os produtos + valor de instalacao + frete
2. **Linha "Total Lucro"** -- soma de todos os `lucro_item` dos produtos + lucro da instalacao

## Detalhes tecnicos

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Apos a linha do Frete (linha 802), inserir duas `TableRow`:

**Linha Total Geral:**
- `colSpan={6}` com texto "Total Geral" em negrito
- Coluna Valor Total: soma de `produtos.valor_total` + `valorInstalacao` + `venda.valor_frete`
- Coluna Lucro: soma de `produtos.lucro_item` (quando existente) + `lucroInstalacaoCalculado`
- Estilo: fundo destacado (`bg-white/10`), texto branco, borda superior

**Linha Total Lucro:**
- `colSpan={6}` com texto "Total Lucro"
- Coluna Valor Total: vazia
- Coluna Lucro: soma total dos lucros com badge verde
- Estilo: fundo verde sutil (`bg-emerald-500/5`)

Os calculos usarao `reduce` sobre o array `produtos` para somar `valor_total` e `lucro_item`, somando tambem instalacao e frete conforme aplicavel.

