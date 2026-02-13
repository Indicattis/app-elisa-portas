
# Filtrar pastas de itens do pedido para mostrar apenas portas

## Problema
Atualmente, todos os produtos da venda (incluindo adicionais, acessorios, manutencao, pintura) aparecem como "pastas" no editor de linhas do pedido. O esperado e que apenas portas de enrolar e portas sociais gerem pastas.

## Alteracao

### Arquivo: `src/components/pedidos/PedidoLinhasEditor.tsx`
- Na linha 258, filtrar `portasRaw` antes de expandir, mantendo apenas produtos com `tipo_produto` igual a `porta_enrolar` ou `porta_social`:

```
const portasFiltradas = portasRaw.filter(
  (p: any) => p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta_social'
);
const portas = expandirPortasPorQuantidade(portasFiltradas);
```

Isso garante que adicionais, acessorios, manutencao e pintura epoxi nao gerem pastas no editor de itens do pedido.
