
# Plano: Adicionar Botão "Criar Pedido" para Vendas Já Faturadas

## Problema Identificado

Na página `/administrativo/financeiro/faturamento/:id`, quando uma venda já está faturada:
- Só aparece o botão "Remover Faturamento"
- Não há opção para criar pedido de produção
- O diálogo de criação só aparece após completar o faturamento

Vendas faturadas anteriormente ou quando o usuário clicou "Não, criar depois" ficam sem forma de gerar o pedido.

## Arquivo a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` | Adicionar botão "Criar Pedido" e lógica para verificar se já existe pedido |

## Mudanças Técnicas

### 1. Adicionar State para Controle de Pedido Existente

```typescript
const [hasPedido, setHasPedido] = useState<boolean | null>(null);
```

### 2. Verificar se Existe Pedido ao Carregar a Venda

No `useEffect` que busca a venda, adicionar verificação:

```typescript
useEffect(() => {
  if (id) {
    fetchVenda();
    checkPedidoExistente();
  }
}, [id]);

const checkPedidoExistente = async () => {
  if (!id) return;
  const pedidoId = await checkExistingPedido(id);
  setHasPedido(!!pedidoId);
  if (pedidoId) {
    setPedidoExistenteId(pedidoId);
  }
};
```

### 3. Adicionar Botão "Criar Pedido" no Header

Ao lado do botão "Remover Faturamento", adicionar:

```tsx
{vendaFaturada && (
  <div className="flex gap-2">
    {/* Botão Criar Pedido - só aparece se não tem pedido */}
    {hasPedido === false && (
      <Button
        variant="outline"
        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
        onClick={() => setShowPedidoDialog(true)}
      >
        <Package className="h-4 w-4 mr-2" />
        Criar Pedido
      </Button>
    )}
    
    {/* Botão Acessar Pedido - só aparece se já tem pedido */}
    {hasPedido === true && pedidoExistenteId && (
      <Button
        variant="outline"
        className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
        onClick={() => navigate(`/administrativo/pedidos/${pedidoExistenteId}`)}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Acessar Pedido
      </Button>
    )}
    
    {/* Botão Remover Faturamento */}
    <Button
      variant="outline"
      className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
      onClick={() => setShowRemoverFaturamentoDialog(true)}
    >
      <Undo2 className="h-4 w-4 mr-2" />
      Remover Faturamento
    </Button>
  </div>
)}
```

### 4. Atualizar Lógica do Modal de Criação

Após criar o pedido com sucesso, atualizar o state:

```typescript
const pedidoId = await createPedidoFromVenda(venda.id);
if (pedidoId) {
  setHasPedido(true);
  setPedidoExistenteId(pedidoId);
  // ... toast success
}
```

## Fluxo de Uso

1. Usuário acessa venda já faturada em `/administrativo/financeiro/faturamento/:id`
2. Sistema verifica automaticamente se existe pedido vinculado
3. Se NÃO existe pedido: mostra botão verde "Criar Pedido"
4. Se JÁ existe pedido: mostra botão azul "Acessar Pedido"
5. Ao clicar em "Criar Pedido", abre o diálogo de confirmação
6. Após criar, o botão muda para "Acessar Pedido"

## Resultado Esperado

- Vendas faturadas sem pedido poderão ter o pedido criado a qualquer momento
- Vendas que já têm pedido mostrarão link direto para acessá-lo
- Interface clara indicando o estado atual (com ou sem pedido)
