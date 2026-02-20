

# Substituir Numeracao de Posicao por Simbolos do Cliente

## O que muda

Na pagina de gestao de fabrica (`/direcao/gestao-fabrica`), o badge numerico de posicao (1o, 2o, 3o...) sera substituido pelos icones de fidelizado (estrela) e parceiro (triangulo) do cliente vinculado ao pedido. Isso permite identificar visualmente a prioridade por tipo de cliente.

## Como funciona

- Se o cliente for fidelizado: exibe estrela preenchida dourada
- Se o cliente for parceiro: exibe triangulo preenchido roxo
- Se for ambos: exibe os dois icones
- Se nao for nenhum: nao exibe nada (espaco vazio)

## Alteracoes

### 1. `src/hooks/usePedidosEtapas.ts` - Adicionar dados do cliente na query

Na query principal de `usePedidosEtapas`, adicionar o join com `clientes` via `cliente_id` na sub-query de vendas:

```text
vendas:venda_id (
  ...campos existentes...,
  cliente_id,
  cliente:clientes!vendas_cliente_id_fkey (
    fidelizado,
    parceiro
  )
)
```

### 2. `src/components/pedidos/PedidoCard.tsx` - Substituir badge de posicao

Nos dois locais onde o badge de posicao e renderizado (grid view ~linha 1100 e mobile view ~linha 1878):

**Antes:**
```text
{posicao && (
  <Badge variant="outline" className={...}>
    {posicao}o
  </Badge>
)}
```

**Depois:**
```text
{(() => {
  const cliente = venda?.cliente;
  const isFidelizado = cliente?.fidelizado;
  const isParceiro = cliente?.parceiro;
  if (!isFidelizado && !isParceiro) return null;
  return (
    <div className="flex items-center gap-0.5">
      {isFidelizado && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
      {isParceiro && <Triangle className="h-4 w-4 text-purple-500 fill-purple-500" />}
    </div>
  );
})()}
```

- Importar `Star` e `Triangle` do lucide-react (Star ja esta importado, adicionar Triangle)
- Manter o badge de "CORRECAO" inalterado

### 3. Arquivos modificados

- `src/hooks/usePedidosEtapas.ts` - query com join ao clientes
- `src/components/pedidos/PedidoCard.tsx` - renderizacao dos icones no lugar da posicao

### Notas

- A prop `posicao` continua existindo no componente (usada para drag-and-drop e botoes de mover prioridade), apenas a **exibicao visual** muda
- Os botoes de mover prioridade (setas cima/baixo) continuam funcionando normalmente pois usam a prop `posicao` e `total`
- A pagina de expedicao (`ExpedicaoMinimalista`) tambem usa `showPosicao` mas nao sera afetada pois mantera a renderizacao condicional

