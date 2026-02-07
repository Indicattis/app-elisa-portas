

# Visualizacao Mobile dedicada para Gestao de Fabrica

## Resumo

Criar um componente mobile que substitui a visualizacao desktop em `/direcao/gestao-fabrica` quando em tela pequena. Usa carrossel horizontal (swipe) para navegar entre etapas, lista minimalista de pedidos por etapa, downbar ao clicar num pedido, e desempenho compacto.

## Estrutura

### 1. Novo componente: `src/components/direcao/GestaoFabricaMobile.tsx`

Componente completo para a visualizacao mobile contendo:

**Header de desempenho (compacto)**
- Carrossel horizontal com os 5 cards de desempenho (Perfiladas, Soldadas, Separadas, Pintura, Carregamentos)
- Cada card mostra icone + valor + top 1 colaborador
- Usa Embla Carousel para swipe suave
- Seletor de periodo simplificado (apenas Hoje/Semana/Mes)

**Carrossel de etapas (corpo principal)**
- Usa Embla Carousel (ja instalado) com 9 slides, um por etapa
- Indicadores de etapa no topo: pills horizontais com icone + contador, scroll horizontal
- A pill ativa sincroniza com o slide visivel
- Cada slide contem a lista de pedidos daquela etapa
- Swipe esquerda/direita para navegar

**Card de pedido mobile (minimalista)**
- Uma linha por pedido: numero do pedido, nome do cliente (truncado), cidade, cronometro
- Altura fixa ~48px por item
- Ao tocar, abre `PedidoDetalhesSheet` (downbar ja existente)

**Integracao com neo instalacoes/correcoes**
- Na etapa "instalacoes", mostra neo instalacoes acima dos pedidos
- Na etapa "correcoes", mostra neo correcoes acima dos pedidos

### 2. Modificacao: `src/pages/direcao/GestaoFabricaDirecao.tsx`

- Importar `useIsMobile` e `GestaoFabricaMobile`
- No return, condicionar: se mobile renderiza `GestaoFabricaMobile`, senao renderiza o layout atual
- Passar todos os handlers e dados necessarios como props

## Detalhes tecnicos

### Props do GestaoFabricaMobile

```typescript
interface GestaoFabricaMobileProps {
  contadores: Record<string, number>;
  onRefresh: () => void;
}
```

O componente mobile fara suas proprias queries internamente (usePedidosEtapas, usePortasPorEtapa, useDesempenhoEtapas) para manter independencia e simplicidade, mudando a etapa ativa conforme o carrossel se move.

### Carrossel de etapas

```typescript
const [emblaRef, emblaApi] = useEmblaCarousel({ 
  align: 'start',
  containScroll: false 
});

// Sincronizar etapa ativa com slide visivel
useEffect(() => {
  if (!emblaApi) return;
  const onSelect = () => {
    const index = emblaApi.selectedScrollSnap();
    setEtapaAtiva(ORDEM_ETAPAS[index]);
  };
  emblaApi.on('select', onSelect);
  return () => { emblaApi.off('select', onSelect); };
}, [emblaApi]);
```

### Card mobile do pedido

```typescript
// Cada pedido renderiza como:
<div onClick={() => setSelectedPedido(pedido)} className="...">
  <span className="text-xs font-mono">#{numeroPedido}</span>
  <span className="text-sm truncate flex-1">{clienteNome}</span>
  <CronometroEtapaBadge ... />
</div>
```

### Downbar

Reutiliza o `PedidoDetalhesSheet` ja existente, que e aberto quando o usuario toca num pedido.

### Desempenho mobile

Carrossel horizontal com cards compactos (icone + valor grande + label). Cada card ocupa ~70% da largura da tela, permitindo ver parte do proximo. Sem ranking de colaboradores no mobile para manter minimalista.

## Arquivos

1. **Criar**: `src/components/direcao/GestaoFabricaMobile.tsx`
2. **Editar**: `src/pages/direcao/GestaoFabricaDirecao.tsx` (condicionar mobile vs desktop)

