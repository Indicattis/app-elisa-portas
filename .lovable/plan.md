
# Plano: Adicionar Seção "Vendas Faturadas Sem Pedido" em /administrativo/pedidos

## Objetivo

Adicionar uma seção no topo da página `/administrativo/pedidos` que liste vendas faturadas dos últimos 3 meses que ainda não possuem pedidos de produção vinculados, permitindo ao usuário criar o pedido diretamente.

## Componente a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/pedidos/VendasFaturadasSemPedido.tsx` | Novo componente que lista vendas faturadas sem pedido |

## Arquivo a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/administrativo/PedidosAdminMinimalista.tsx` | Importar e adicionar o novo componente antes das tabs |

## Estrutura do Componente

Baseado no componente existente `VendasNaoFaturadasHistorico`, o novo componente terá:

### Interface de Dados
```typescript
interface VendaFaturadaSemPedido {
  id: string;
  data_venda: string;
  cliente_nome: string | null;
  atendente_nome: string;
  atendente_foto: string | null;
  valor_venda: number;
  valor_credito: number;
  dias_desde_faturamento: number;
}
```

### Lógica de Busca
1. Buscar vendas dos últimos 3 meses
2. Filtrar vendas onde TODOS os produtos têm `faturamento = true`
3. Verificar se existe pedido vinculado na tabela `pedidos_producao.venda_id`
4. Retornar apenas as que NÃO têm pedido

### Query SQL (lógica)
```sql
-- Vendas com todos produtos faturados
SELECT v.* FROM vendas v
WHERE v.data_venda >= (now() - interval '3 months')
  AND NOT EXISTS (
    SELECT 1 FROM pedidos_producao pp WHERE pp.venda_id = v.id
  )
  AND (
    SELECT COUNT(*) FROM produtos_vendas pv 
    WHERE pv.venda_id = v.id AND pv.faturamento = true
  ) = (
    SELECT COUNT(*) FROM produtos_vendas pv WHERE pv.venda_id = v.id
  )
```

### Visual
- Card com gradiente verde (para indicar positividade - venda faturada)
- Ícone de Package + Check
- Tabela com: Data, Cliente, Atendente, Dias desde faturamento, Valor, Ação
- Botão "Criar Pedido" em cada linha que navega para `/administrativo/financeiro/faturamento/:id`
- Contador no header mostrando quantidade de vendas pendentes

### Fluxo de Uso
1. Usuário acessa `/administrativo/pedidos`
2. Vê no topo a seção "Vendas Faturadas Sem Pedido (Últimos 3 Meses)"
3. Clica na linha ou no botão "Criar Pedido"
4. É redirecionado para a página de faturamento da venda onde pode criar o pedido
5. Após criar, a venda some da lista automaticamente

## Detalhes Técnicos

### Código do Componente (resumo)
```tsx
export function VendasFaturadasSemPedido() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<VendaFaturadaSemPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchVendasFaturadasSemPedido();
  }, []);

  const fetchVendasFaturadasSemPedido = async () => {
    // 1. Buscar vendas dos últimos 3 meses com produtos
    const { data: vendasData } = await supabase
      .from("vendas")
      .select(`
        id, data_venda, cliente_nome, atendente_id, valor_venda, valor_credito,
        produtos_vendas (id, faturamento)
      `)
      .gte("data_venda", dataLimite);

    // 2. Filtrar vendas totalmente faturadas
    const vendasFaturadas = vendasData.filter(v => {
      const produtos = v.produtos_vendas || [];
      return produtos.length > 0 && produtos.every(p => p.faturamento === true);
    });

    // 3. Verificar quais NÃO têm pedido
    const { data: pedidos } = await supabase
      .from("pedidos_producao")
      .select("venda_id")
      .in("venda_id", vendasFaturadas.map(v => v.id));

    const vendasComPedido = new Set(pedidos?.map(p => p.venda_id));
    const vendasSemPedido = vendasFaturadas.filter(v => !vendasComPedido.has(v.id));

    // 4. Processar e retornar
    setVendas(processedVendas);
  };

  // Render: Card com tabela similar a VendasNaoFaturadasHistorico
}
```

### Integração na Página
```tsx
// Em PedidosAdminMinimalista.tsx
import { VendasFaturadasSemPedido } from "@/components/pedidos/VendasFaturadasSemPedido";

// Adicionar antes das Tabs
<VendasFaturadasSemPedido />

<Tabs value={activeTab} onValueChange={setActiveTab}>
  ...
</Tabs>
```

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────────────────────┐
│ 📦✓ Vendas Faturadas Sem Pedido (Últimos 3 Meses)    [5]        │
├─────────────────────────────────────────────────────────────────┤
│ Data       │ Cliente         │ Atendente │ Dias │ Valor   │ Ação│
│ 15/01/2026 │ João Silva      │ Maria     │ 20   │ R$5.000 │ [→] │
│ 10/01/2026 │ Pedro Santos    │ Carlos    │ 25   │ R$3.200 │ [→] │
│ ...                                                             │
├─────────────────────────────────────────────────────────────────┤
│ Total: R$ 15.000,00                        [Ver todas (5)]      │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos a Criar/Modificar

1. **Criar**: `src/components/pedidos/VendasFaturadasSemPedido.tsx`
2. **Modificar**: `src/pages/administrativo/PedidosAdminMinimalista.tsx` - adicionar import e componente
