
# Plano: Tag "Galvanizada" e Tags de Cores na Downbar

## O que muda

### 1. Lista de pedidos (PedidoCard.tsx) - Coluna de Cores
Quando um pedido **nao tem cores** definidas nos produtos, em vez de exibir um travessao ("--"), exibir uma tag/badge com o texto **"Galvanizada"** com estilo visual neutro (cinza/prata) para indicar que as portas sao de aco galvanizado sem pintura.

### 2. Downbar de detalhes do pedido (PedidoDetalhesSheet.tsx) - Tags de Cores
Adicionar na **Hero Section** (abaixo das informacoes do cliente) tags visuais mostrando as cores do pedido:
- Se houver cores, exibir badges coloridas com o nome de cada cor e um circulo com o hex correspondente
- Se nao houver cores, exibir a tag **"Galvanizada"**

---

## Detalhes Tecnicos

### Arquivo: `src/components/pedidos/PedidoCard.tsx`

**Linhas ~1385-1387** - Substituir o fallback atual (travessao) por uma badge "Galvanizada":

```tsx
// Antes:
<span className="text-gray-300 text-[10px]">—</span>

// Depois:
<Badge variant="outline" className="text-[8px] px-1 py-0 h-4 bg-gray-200/20 text-gray-500 border-gray-400/30">
  Galvanizada
</Badge>
```

### Arquivo: `src/components/pedidos/PedidoDetalhesSheet.tsx`

**Apos a linha 462** (fechamento do bloco de telefone/cidade) - Adicionar secao de cores dentro da Hero Section:

1. Importar `Paintbrush` de lucide-react (se nao importado)
2. Extrair cores unicas dos produtos da venda (mesmo padrao do PedidoCard)
3. Renderizar tags de cores ou "Galvanizada":

```tsx
{/* Cores do Pedido */}
<div className="flex flex-wrap items-center gap-2 mt-3">
  {coresUnicas.length > 0 ? (
    coresUnicas.map((cor) => (
      <div key={cor.nome} className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 border border-white/20">
        <div
          className="w-3 h-3 rounded-full border border-white/30"
          style={{ backgroundColor: cor.codigo_hex }}
        />
        <span className="text-xs text-white/80">{cor.nome}</span>
      </div>
    ))
  ) : (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 border border-white/20">
      <span className="text-xs text-white/60">Galvanizada</span>
    </div>
  )}
</div>
```

A logica de extracao de cores sera identica ao PedidoCard: iterar `produtos_vendas`, coletar `cor.nome` e `cor.codigo_hex` unicos via Map.
