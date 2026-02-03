
# Plano: Adicionar Botao de Imprimir Etiqueta na Sidebar de Ordens por Pedido

## Contexto

A pagina `/fabrica/ordens-pedidos` usa o componente `OrdemLinhasSheet` para exibir detalhes das linhas de uma ordem na sidebar direita. Atualmente, esse componente nao possui a funcionalidade de imprimir etiquetas que existe em `/producao` no componente `OrdemDetalhesSheet`.

## Mudancas Necessarias

### 1. Modificar `src/pages/fabrica/OrdensPorPedido.tsx`

Passar informacoes adicionais do pedido para o `OrdemLinhasSheet`:
- `numeroPedido` - necessario para a etiqueta
- `clienteNome` - opcional para exibicao na etiqueta

```typescript
// Estado atual
const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemStatus | null>(null);

// Adicionar estado para guardar info do pedido
const [pedidoInfo, setPedidoInfo] = useState<{ numeroPedido: string; clienteNome: string } | null>(null);

// Modificar handleOrdemClick para receber pedido tambem
const handleOrdemClick = (ordem: OrdemStatus, pedido: PedidoComOrdens) => {
  setOrdemSelecionada(ordem);
  setPedidoInfo({ numeroPedido: pedido.numero_pedido, clienteNome: pedido.cliente_nome });
  setSheetOpen(true);
};

// Passar para OrdemLinhasSheet
<OrdemLinhasSheet
  ordem={ordemSelecionada}
  numeroPedido={pedidoInfo?.numeroPedido}
  clienteNome={pedidoInfo?.clienteNome}
  open={sheetOpen}
  onOpenChange={setSheetOpen}
/>
```

### 2. Modificar `src/components/fabrica/PedidoOrdemCard.tsx`

Atualizar a interface e callback para passar o pedido completo:

```typescript
// Interface atualizada
interface PedidoOrdemCardProps {
  pedido: PedidoComOrdens;
  onOrdemClick: (ordem: OrdemStatus, pedido: PedidoComOrdens) => void;
}

// Uso atualizado no botao
onClick={() => ordem.existe && onOrdemClick(ordem, pedido)}
```

### 3. Modificar `src/components/fabrica/OrdemLinhasSheet.tsx`

Adicionar funcionalidade de impressao de etiquetas:

**Novos imports:**
```typescript
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { useEtiquetasProducao } from "@/hooks/useEtiquetasProducao";
import { gerarPDFEtiquetaProducao } from "@/utils/etiquetasPDFGenerator";
```

**Props atualizadas:**
```typescript
interface OrdemLinhasSheetProps {
  ordem: OrdemStatus | null;
  numeroPedido?: string;
  clienteNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Mapeamento de tipo para label de etiqueta:**
```typescript
const TIPO_ORDEM_ETIQUETA: Record<TipoOrdem, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separação',
  qualidade: 'Qualidade',
  pintura: 'Pintura',
};
```

**Hook e funcao de impressao:**
```typescript
const { calcularEtiquetasLinha } = useEtiquetasProducao();

const handleImprimirEtiqueta = (linha: LinhaOrdem) => {
  try {
    const linhaParaCalculo = {
      id: linha.id,
      item: linha.estoque?.nome_produto || linha.item,
      quantidade: linha.quantidade,
      tamanho: linha.tamanho,
      largura: linha.largura,
      altura: linha.altura,
    };
    
    const calculo = calcularEtiquetasLinha(linhaParaCalculo);
    
    const tag = {
      tagNumero: 1,
      totalTags: calculo.etiquetasNecessarias,
      nomeProduto: calculo.nomeProduto,
      numeroPedido: numeroPedido || ordem?.numero_ordem || '',
      quantidade: calculo.quantidade,
      largura: calculo.largura,
      altura: calculo.altura,
      clienteNome: clienteNome,
      tamanho: linha.tamanho,
      origemOrdem: TIPO_ORDEM_ETIQUETA[ordem?.tipo || 'separacao'],
      responsavelNome: ordem?.responsavel?.nome,
    };
    
    const doc = gerarPDFEtiquetaProducao(tag);
    
    // Codigo de impressao via iframe (mesmo padrao de OrdemDetalhesSheet)
    const blobUrl = String(doc.output('bloburl'));
    const iframe = document.createElement('iframe');
    // ... configuracao do iframe para impressao
    
    toast.success('1 etiqueta pronta para impressão');
  } catch (error) {
    console.error('Erro ao gerar etiqueta:', error);
    toast.error('Erro ao gerar etiqueta');
  }
};
```

**Botao de impressao em cada linha:**
Adicionar botao `Printer` apos a coluna de dimensoes em cada linha da lista:

```typescript
// Na grid de cada linha, adicionar coluna para botao de impressao
<div 
  className="grid gap-2 ..."
  style={{ gridTemplateColumns: '24px 1fr 45px 55px 85px 36px' }} // Adicionar coluna
>
  {/* ... colunas existentes ... */}
  
  {/* Nova coluna - Botao imprimir */}
  <div className="flex items-center justify-center h-full">
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0"
      onClick={() => handleImprimirEtiqueta(linha)}
      title="Imprimir etiqueta"
    >
      <Printer className="h-4 w-4 text-zinc-400 hover:text-white" />
    </Button>
  </div>
</div>
```

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/fabrica/OrdensPorPedido.tsx` | Adicionar estado para info do pedido e passar para sheet |
| `src/components/fabrica/PedidoOrdemCard.tsx` | Atualizar callback para passar pedido completo |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Adicionar funcionalidade de impressao de etiquetas |

## Resultado Esperado

Apos a implementacao, cada linha na sidebar de detalhes de ordem tera um icone de impressora que, ao ser clicado, gerara e enviara para impressao uma etiqueta no mesmo formato usado em `/producao`.
