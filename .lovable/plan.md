

# Agrupar itens do pedido por porta em grid de pastas (PedidoViewDirecao)

## Resumo

Transformar a lista flat de itens do pedido na pagina `/direcao/pedidos/:id` em um layout de pastas em grid, agrupando as linhas por porta (`produto_venda_id` + `indice_porta`), similar ao que ja foi feito no `PedidoLinhasEditor`.

## O que muda visualmente

A secao "Itens do Pedido" atual (lista simples) sera substituida por:

1. **Grid de cards/pastas** (2 colunas mobile, 3 colunas desktop) - cada pasta representa uma porta
2. **Ao clicar** numa pasta, a lista de itens daquela porta aparece abaixo do grid
3. **Pastas sem porta** aparecem como card separado ("Sem produto")

## Detalhes tecnicos

### Arquivo modificado: `src/pages/direcao/PedidoViewDirecao.tsx`

1. **Buscar dados das portas**: Adicionar query a `produtos_vendas` usando os `produto_venda_id` unicos das linhas para obter `tipo_produto`, `largura`, `altura`. Isso substitui o `portasMap` atual (que so guarda indice numerico).

2. **Estado de pasta aberta**: `const [pastaAberta, setPastaAberta] = useState<string | null>(null)`

3. **Agrupar linhas por porta**: Usar `useMemo` para agrupar `pedido.linhas` por chave `${produto_venda_id}_${indice_porta}`, gerando array de grupos com label, dimensoes e contagem.

4. **Renderizar grid**: Substituir o bloco de linhas (linhas 392-427) por:
   - Grid de cards usando o estilo do dark theme da pagina (bg-white/5, text-white)
   - Cada card mostra: label da porta, dimensoes, contagem de itens
   - Card selecionado destaca com borda
   - Abaixo do grid, lista expandida com os itens da pasta selecionada

5. **Adaptar PortaFolderCard ou criar inline**: Como o `PortaFolderCard` existente usa `CategoriaLinha` (que nao existe nesta pagina), criarei cards inline com o estilo dark da pagina, sem depender de `CategoriaLinha`.

### Interface da porta (dados buscados)

```typescript
interface PortaInfo {
  id: string;
  tipo_produto: string;
  largura: number;
  altura: number;
}
```

### Logica de agrupamento

```typescript
// Chave: "produto_venda_id_indicePorta" ou "sem_porta"
const grupos = useMemo(() => {
  const map = new Map();
  pedido.linhas.forEach(linha => {
    const key = linha.produto_venda_id 
      ? `${linha.produto_venda_id}_${linha.indice_porta ?? 0}` 
      : 'sem_porta';
    // agrupar...
  });
  return [...map.entries()];
}, [pedido.linhas]);
```

### Sem mudancas em outros arquivos

Apenas `PedidoViewDirecao.tsx` sera modificado.
