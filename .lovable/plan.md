
# Plano: Simplificar Aprovacao e Adicionar Downbar de Detalhes

## Objetivo
1. Remover os 2 checkboxes obrigatorios - ter apenas um botao "Aprovar"
2. Ao clicar em "Ver Detalhes", abrir a downbar (PedidoDetalhesSheet) em vez de navegar para outra pagina

## Alteracoes

### 1. AprovacoesProducao.tsx

**Remover:**
- Secao de checkboxes do card expandido
- Funcao `todosCheckboxesMarcados`
- Funcao `handleCheckboxChange`
- Mensagem "Marque todos os itens obrigatorios..."
- Import do Checkbox

**Adicionar:**
- State para pedido selecionado e controle do sheet
- Import do PedidoDetalhesSheet
- Componente PedidoDetalhesSheet no final

**Modificar:**
- Botao "Aprovar" sempre habilitado (sem verificacao de checkboxes)
- Botao "Ver Detalhes" abre o sheet em vez de navegar

### 2. usePedidosAprovacaoCEO.ts

**Modificar:**
- Query para buscar dados completos do pedido (necessarios para o PedidoDetalhesSheet)
- Funcao `aprovarPedido` para nao validar checkboxes, apenas avancar diretamente

---

## Codigo Resumido

### AprovacoesProducao.tsx

```typescript
import { PedidoDetalhesSheet } from '@/components/pedidos/PedidoDetalhesSheet';

// Novos states
const [selectedPedido, setSelectedPedido] = useState<any>(null);
const [showDetalhes, setShowDetalhes] = useState(false);

// Handler para abrir detalhes
const handleOpenDetalhes = (pedido: any) => {
  setSelectedPedido(pedido);
  setShowDetalhes(true);
};

// Botao de aprovar (sem verificacao de checkboxes)
<Button
  onClick={() => handleAprovar(pedido.id)}
  disabled={aprovarPedido.isPending}
  className="w-full h-14 ..."
>
  Aprovar e Enviar para Producao
</Button>

// Botao de detalhes (abre sheet)
<Button
  variant="outline"
  onClick={() => handleOpenDetalhes(pedido)}
>
  Ver Detalhes do Pedido
</Button>

// Sheet no final
{selectedPedido && (
  <PedidoDetalhesSheet 
    pedido={selectedPedido} 
    open={showDetalhes} 
    onOpenChange={setShowDetalhes} 
  />
)}
```

### usePedidosAprovacaoCEO.ts

```typescript
// Query expandida para incluir dados completos
const { data: pedidosData } = await supabase
  .from('pedidos_producao')
  .select(`
    *,
    vendas:venda_id (
      *,
      produtos_vendas (*)
    )
  `)
  .eq('etapa_atual', 'aprovacao_ceo')
  .eq('arquivado', false);

// Aprovar sem validar checkboxes
const aprovarPedido = useMutation({
  mutationFn: async (pedidoId: string) => {
    // Avancar diretamente sem validacao
    await moverParaProximaEtapa.mutateAsync({ pedidoId });
  },
  ...
});
```

## Resultado

- Interface mais simples: card mostra resumo, botao unico "Aprovar"
- Clique em "Ver Detalhes" abre a downbar completa do pedido
- Diretor pode aprovar com um unico toque
- Mantem todas as informacoes detalhadas acessiveis via downbar
