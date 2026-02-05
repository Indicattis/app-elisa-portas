
# Plano: Melhorar Cards da Listagem de Aprovações Fábrica

## Objetivo
Enriquecer os cards de pedidos em `/direcao/aprovacoes/fabrica` com mais informações visuais e adicionar botão de anexo na downbar.

## Alterações Visuais no Card

```text
+--------------------------------------------------+
| Helio João Barbosa                        [>]    |  <- Nome do cliente como título
| PED-0190 | 🟠 🟠 🔵 (P G G) | 🔧 | ⬛⬛        |  <- Número + portas + ícone + cores
| ⏱ 2d 5h  | Criado: 04/02/2026                    |  <- Cronômetro + data
+--------------------------------------------------+
```

### Elementos a adicionar:
1. **Nome do cliente como título principal** (substituir número do pedido)
2. **Badges P/G das portas** (laranja = P pequena ≤25m², azul = G grande >25m²)
3. **Ícone de tipo de entrega** (Hammer = instalação, Truck = entrega, Wrench = manutenção)
4. **Círculos de cores** das portas de enrolar
5. **Cronômetro de tempo na etapa** usando CronometroEtapaBadge existente
6. **Botão de anexo na downbar** (já existe, só precisa estar visível)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/usePedidosAprovacaoCEO.ts` | Incluir mais dados: tipo_entrega, cores, produtos detalhados, data_entrada na etapa |
| `src/pages/direcao/aprovacoes/AprovacoesProducao.tsx` | Redesenhar card com novos elementos visuais |

---

## Detalhes Técnicos

### 1. usePedidosAprovacaoCEO.ts - Expandir Interface

```typescript
export interface PedidoAprovacao {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  valor_venda: number | null;
  data_entrega: string | null;
  created_at: string;
  produtos_resumo: string;
  pedidoCompleto: any;
  
  // Novos campos
  tipo_entrega: 'instalacao' | 'entrega' | 'manutencao' | null;
  data_entrada_etapa: string | null;  // Para cronômetro
  portasInfo: Array<{ tamanho: 'P' | 'G'; largura: number; altura: number }>;
  cores: Array<{ nome: string; codigo_hex: string }>;
  ficha_visita_url: string | null;  // Para botão anexo
}
```

### 2. usePedidosAprovacaoCEO.ts - Query Expandida

```typescript
// Buscar também pedidos_etapas para data_entrada e catalogo_cores
const { data: pedidosData } = await supabase
  .from('pedidos_producao')
  .select(`
    *,
    vendas:venda_id (
      *,
      produtos_vendas (
        *,
        catalogo_cores:cor_id (nome, codigo_hex)
      )
    ),
    pedidos_etapas!inner (
      data_entrada
    )
  `)
  .eq('etapa_atual', 'aprovacao_ceo')
  .eq('arquivado', false)
  .eq('pedidos_etapas.etapa', 'aprovacao_ceo')
  .is('pedidos_etapas.data_saida', null);
```

### 3. AprovacoesProducao.tsx - Novo Layout do Card

```tsx
import { Truck, Hammer, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CronometroEtapaBadge } from '@/components/pedidos/CronometroEtapaBadge';
import { TooltipProvider } from '@/components/ui/tooltip';

// Dentro do card:
<div className="w-full p-4 flex items-center justify-between text-left">
  <div className="flex-1 min-w-0">
    {/* Título: Nome do cliente */}
    <p className="font-semibold text-base truncate">{pedido.cliente_nome}</p>
    
    {/* Linha 2: Número + Badges P/G + Ícone tipo + Cores */}
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      <span className="text-xs text-orange-500 font-mono">{pedido.numero_pedido}</span>
      
      {/* Badges P e G */}
      {pedido.portasInfo.length > 0 && (
        <div className="flex gap-0.5">
          {pedido.portasInfo.map((p, idx) => (
            <Badge 
              key={idx}
              className={cn(
                "text-[9px] h-4 px-1 font-bold",
                p.tamanho === 'P' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
              )}
            >
              {p.tamanho}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Ícone tipo entrega */}
      {pedido.tipo_entrega === 'instalacao' && <Hammer className="w-4 h-4 text-blue-500" />}
      {pedido.tipo_entrega === 'entrega' && <Truck className="w-4 h-4 text-green-500" />}
      {pedido.tipo_entrega === 'manutencao' && <Wrench className="w-4 h-4 text-purple-500" />}
      
      {/* Cores */}
      {pedido.cores.length > 0 && (
        <div className="flex gap-1">
          {pedido.cores.slice(0, 3).map((cor, idx) => (
            <div 
              key={idx}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: cor.codigo_hex }}
              title={cor.nome}
            />
          ))}
        </div>
      )}
    </div>
    
    {/* Linha 3: Cronômetro + Data */}
    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
      <CronometroEtapaBadge dataEntrada={pedido.data_entrada_etapa} />
      <span>{format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
    </div>
  </div>
  <ChevronRight className="w-5 h-5 ..." />
</div>
```

### 4. Botão de Anexo na Downbar

O componente PedidoDetalhesSheet já possui o botão de anexo (linhas 401-412):

```tsx
{pedido.ficha_visita_url && (
  <Button
    variant="outline"
    size="sm"
    className="bg-amber-500/10 border-amber-500/30 text-amber-400..."
    asChild
  >
    <a href={pedido.ficha_visita_url} target="_blank">
      <FileText className="w-4 h-4 mr-2" />
      Anexo
    </a>
  </Button>
)}
```

**Já está implementado!** O botão aparece automaticamente quando `pedido.ficha_visita_url` existe. Precisamos apenas garantir que o campo seja passado corretamente no `pedidoCompleto`.

---

## Cálculo de P/G das Portas

Reutilizar lógica existente do PedidoCard.tsx:

```typescript
const calcularPortasInfo = (produtos: any[]) => {
  const portasEnrolar = produtos.filter(p => p.tipo_produto === 'porta_enrolar');
  const lista: Array<{ tamanho: 'P' | 'G'; largura: number; altura: number }> = [];
  
  portasEnrolar.forEach(p => {
    let largura = p.largura || 0;
    let altura = p.altura || 0;
    
    if (largura === 0 && altura === 0 && p.tamanho) {
      // Parse "3.5x2.8" para números
      const match = p.tamanho.match(/(\d+[.,]?\d*)\s*[xX]\s*(\d+[.,]?\d*)/);
      if (match) {
        largura = parseFloat(match[1].replace(',', '.'));
        altura = parseFloat(match[2].replace(',', '.'));
      }
    }
    
    const area = largura * altura;
    const quantidade = p.quantidade || 1;
    const tamanhoCategoria = area > 25 ? 'G' : 'P';
    
    for (let i = 0; i < quantidade; i++) {
      lista.push({ tamanho: tamanhoCategoria, largura, altura });
    }
  });
  
  return lista;
};
```

---

## Extração de Cores

```typescript
const extrairCores = (produtos: any[]) => {
  const coresMap = new Map<string, { nome: string; codigo_hex: string }>();
  
  produtos.forEach(p => {
    if (p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'pintura_epoxi') {
      const cor = p.catalogo_cores || p.cor;
      if (cor?.nome && cor?.codigo_hex) {
        coresMap.set(cor.nome, { nome: cor.nome, codigo_hex: cor.codigo_hex });
      }
    }
  });
  
  return Array.from(coresMap.values());
};
```

---

## Resultado Final

O card mostrará:
- **Título**: Nome do cliente (ex: "Helio João Barbosa")
- **Segunda linha**: Número do pedido + badges P/G + ícone de tipo + bolinhas de cor
- **Terceira linha**: Cronômetro de tempo na etapa + data de criação
- **Downbar**: Botão "Anexo" visível quando houver ficha de visita

Todos os elementos seguem padrões já existentes no sistema (PedidoCard.tsx, CronometroEtapaBadge, etc.).
