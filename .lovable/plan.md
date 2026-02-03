
# Plano: Exibir Ordens de Carregamento e Instalacao no Card de Pedido

## Problema Identificado

O hook `useOrdensPorPedido.ts` ja busca as ordens de carregamento e instalacao corretamente (linhas 167-174 e 280-302), mas o componente `PedidoOrdemCard.tsx` nao inclui essas ordens no array que e renderizado na interface.

## Mudancas Necessarias

### Modificar `src/components/fabrica/PedidoOrdemCard.tsx`

**1. Adicionar ordens de carregamento e instalacao ao array (linhas 57-63):**

```typescript
// ANTES
const ordens: OrdemStatus[] = [
  pedido.ordens.soldagem,
  pedido.ordens.perfiladeira,
  pedido.ordens.separacao,
  pedido.ordens.qualidade,
  pedido.ordens.pintura,
];

// DEPOIS
const ordens: OrdemStatus[] = [
  pedido.ordens.soldagem,
  pedido.ordens.perfiladeira,
  pedido.ordens.separacao,
  pedido.ordens.qualidade,
  pedido.ordens.pintura,
  pedido.ordens.carregamento,
  pedido.ordens.instalacao,
];
```

**2. Adicionar status "agendado" na funcao getStatusStyle (linhas 25-39):**

```typescript
case 'agendado':
  return 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30';
```

**3. Adicionar label para status "agendado" na funcao getStatusLabel (linhas 41-52):**

```typescript
case 'agendado':
  return 'Agendado';
```

## Arquivos a Modificar

| Arquivo | Linhas | Acao |
|---------|--------|------|
| `src/components/fabrica/PedidoOrdemCard.tsx` | 57-63 | Adicionar carregamento e instalacao ao array |
| `src/components/fabrica/PedidoOrdemCard.tsx` | 25-39 | Adicionar estilo para status "agendado" |
| `src/components/fabrica/PedidoOrdemCard.tsx` | 41-52 | Adicionar label para status "agendado" |

## Resultado Esperado

Apos a correcao, ao expandir um card de pedido em `/fabrica/ordens-pedidos`, serao exibidos 7 badges de ordens:
- Soldagem
- Perfiladeira
- Separacao
- Qualidade
- Pintura
- **Carregamento** (novo)
- **Instalacao** (novo)

Os status possiveis para carregamento/instalacao serao:
- Pendente (amarelo) - sem data agendada
- Agendado (roxo) - com data marcada
- Concluido (verde) - finalizado
