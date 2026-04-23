

## Adicionar botão "Criar Pedido" na aba Aprovação Diretor

Em `/direcao/gestao-fabrica` aba **Aprovação Diretor**, as vendas faturadas aguardando criação de pedido (renderizadas pelo `VendaPendentePedidoCard` em `mode='pedido'`) hoje só têm 2 botões de ação: **Dispensar** (amarelo) e **Concluir Direto / Arquivo Morto** (vermelho). Falta o botão principal — **Criar Pedido** — que efetivamente chama `handleCriarPedido` (já implementado no componente, função `createPedidoFromVenda`).

A grid já reserva 3 slots de ação (`30px 30px 30px`), portanto há espaço; basta renderizar o botão.

### Mudança

Em `src/components/pedidos/VendaPendentePedidoCard.tsx`, no bloco `mode === 'pedido'` (a partir da linha ~603), adicionar um terceiro botão **antes** do "Dispensar" e do "Concluir Direto":

```tsx
{/* Criar Pedido */}
<div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="icon"
        variant="outline"
        disabled={isCreating}
        className="flex h-[20px] w-full rounded-[3px] border-primary/50 text-primary hover:bg-primary/10"
        onClick={handleCriarPedido}
      >
        {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent><p className="text-xs">Criar Pedido de Produção</p></TooltipContent>
  </Tooltip>
</div>
```

A função `handleCriarPedido`, o estado `isCreating` e os ícones `Plus`/`Loader2` já estão importados e implementados no arquivo — o botão apenas estava faltando.

### Resultado

Aba Aprovação Diretor → cada venda pendente passa a mostrar 3 ações:
1. **Criar Pedido** (azul, ícone +) — gera pedido na etapa `aprovacao_diretor` via `createPedidoFromVenda`.
2. **Dispensar** (amarelo, ícone ⚠) — marca `pedido_dispensado` e remove da lista.
3. **Concluir Direto** (vermelho, ícone Archive) — cria pedido e arquiva imediatamente.

### Fora de escopo

- Não altera `mode='faturamento'` (que já tem link "Faturar →").
- Não muda hook `usePedidoCreation` nem fluxo do pedido criado.
- Sem migrações.

### Arquivos

- `src/components/pedidos/VendaPendentePedidoCard.tsx` — adicionar botão "Criar Pedido" no bloco `mode === 'pedido'`.

