

# Corrigir indices das abas de Expedição para mostrar total combinado consistente

## Problema

Os badges das abas (ex: "60" em Instalações) mostram o total combinado (pedidos + neo_instalacoes/neo_correcoes), porem o texto dentro da aba mostra apenas `pedidosFiltrados.length` (ex: "22 pedidos"). Os numeros ficam inconsistentes.

## Solucao

Ajustar o texto dentro do conteudo de cada aba para incluir o total combinado (pedidos + itens avulsos), de forma consistente com o badge.

## Mudancas

**Arquivo:** `src/pages/logistica/ExpedicaoMinimalista.tsx`

### 1. Calcular total combinado para exibicao no header da aba

Na secao do `CardHeader` dentro do `TabsContent` (linha ~784), substituir `pedidosFiltrados.length` pelo total combinado:

- Para a aba `instalacoes`: total = `pedidosFiltrados.length + neoInstalacoesListagem.length`
- Para a aba `correcoes`: total = `pedidosFiltrados.length + neoCorrecoesListagem.length`
- Para as demais abas: total = `pedidosFiltrados.length` (sem mudanca)

Alterar o texto de:
```
{pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
```
Para:
```typescript
const totalItensEtapa = etapaAtiva === 'instalacoes' 
  ? pedidosFiltrados.length + neoInstalacoesListagem.length
  : etapaAtiva === 'correcoes'
  ? pedidosFiltrados.length + neoCorrecoesListagem.length
  : pedidosFiltrados.length;

// Exibir:
{totalItensEtapa} {totalItensEtapa === 1 ? 'item' : 'itens'}
```

Trocar a palavra "pedido/pedidos" por "item/itens" nas abas que misturam tipos, para ser semanticamente correto.

