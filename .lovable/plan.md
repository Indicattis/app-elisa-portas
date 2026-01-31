
# Plano: Nova Etapa "Aprovação CEO" no Fluxo de Pedidos

## Visão Geral

Adicionar uma nova etapa chamada **"Aprovação CEO"** entre "Em Aberto" e "Em Produção". Esta etapa permite que pedidos sejam revisados e aprovados pela diretoria antes de entrar em produção.

## Fluxo Atualizado

```text
┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│  Em Aberto   │ -> │ Aprovação CEO  │ -> │ Em Produção  │ -> ...
└──────────────┘    └────────────────┘    └──────────────┘
                            │
                    [NOVA ETAPA]
```

## Funcionalidades da Nova Etapa

| Característica | Descrição |
|----------------|-----------|
| **Nome interno** | `aprovacao_ceo` |
| **Label** | "Aprovação CEO" |
| **Cor** | Laranja (`bg-orange-500`) |
| **Ícone** | `ShieldCheck` (verificação de segurança) |
| **Checkboxes** | 2 itens para aprovação |

### Checkboxes da Etapa

1. **"Pedido revisado pela diretoria"** - Obrigatório
2. **"Aprovado para produção"** - Obrigatório

## Alterações Técnicas

### 1. Migração de Banco de Dados

Atualizar as constraints CHECK nas tabelas `pedidos_producao` e `pedidos_etapas` para incluir o novo valor `aprovacao_ceo`.

```sql
-- Remover constraints antigas
ALTER TABLE pedidos_producao DROP CONSTRAINT IF EXISTS pedidos_producao_etapa_atual_check;
ALTER TABLE pedidos_etapas DROP CONSTRAINT IF EXISTS pedidos_etapas_etapa_check;

-- Adicionar novas constraints com aprovacao_ceo
ALTER TABLE pedidos_producao 
ADD CONSTRAINT pedidos_producao_etapa_atual_check 
CHECK (etapa_atual IN (
  'aberto',
  'aprovacao_ceo',  -- NOVA
  'em_producao',
  'inspecao_qualidade', 
  'aguardando_pintura',
  'aguardando_coleta',
  'instalacoes',
  'correcoes',
  'finalizado'
));

-- Mesma atualização para pedidos_etapas
```

### 2. Tipos TypeScript (`src/types/pedidoEtapa.ts`)

**Atualizar o tipo `EtapaPedido`:**
```typescript
export type EtapaPedido = 
  | 'aberto'
  | 'aprovacao_ceo'  // NOVA
  | 'em_producao'
  | ...
```

**Adicionar configuração em `ETAPAS_CONFIG`:**
```typescript
aprovacao_ceo: {
  label: 'Aprovação CEO',
  color: 'bg-orange-500',
  icon: 'ShieldCheck',
  checkboxes: [
    { id: 'pedido_revisado', label: 'Pedido revisado pela diretoria', required: true },
    { id: 'aprovado_producao', label: 'Aprovado para produção', required: true }
  ]
}
```

**Atualizar `ORDEM_ETAPAS`:**
```typescript
export const ORDEM_ETAPAS: EtapaPedido[] = [
  'aberto',
  'aprovacao_ceo',  // NOVA POSIÇÃO
  'em_producao',
  'inspecao_qualidade',
  ...
];
```

### 3. Fluxograma (`src/utils/pedidoFluxograma.ts`)

Adicionar a nova etapa ao `FLUXOGRAMA_ETAPAS` e atualizar a função `determinarFluxograma()` para incluir a etapa de aprovação no fluxo base.

### 4. Hook de Contadores (`src/hooks/usePedidosEtapas.ts`)

Adicionar `aprovacao_ceo: 0` ao objeto inicial de contadores.

### 5. Páginas de Gestão de Pedidos

Atualizar os mapeamentos de ícones em:
- `src/pages/fabrica/PedidosProducaoMinimalista.tsx`
- `src/pages/ProducaoControle.tsx`
- `src/pages/logistica/ControleLogistica.tsx`
- `src/pages/direcao/GestaoFabricaDirecao.tsx`

Adicionar entrada para o ícone:
```typescript
const ETAPA_ICONS = {
  aberto: Clock,
  aprovacao_ceo: ShieldCheck,  // NOVA
  em_producao: Factory,
  ...
};
```

### 6. Ajustes na Criação de Pedido (`src/hooks/usePedidoCreation.ts`)

Verificar se pedidos de manutenção ainda devem pular esta etapa (provavelmente sim, já que vão direto para instalações).

## Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/types/pedidoEtapa.ts` | Tipo, Config, Ordem |
| `src/utils/pedidoFluxograma.ts` | Mapeamento e fluxo |
| `src/hooks/usePedidosEtapas.ts` | Contador inicial |
| `src/pages/fabrica/PedidosProducaoMinimalista.tsx` | Ícone |
| `src/pages/ProducaoControle.tsx` | Ícone |
| `src/pages/logistica/ControleLogistica.tsx` | Ícone |
| `src/pages/direcao/GestaoFabricaDirecao.tsx` | Ícone |
| Nova migração SQL | Constraints do banco |

## Comportamento Esperado

1. **Pedido criado** → Entra em "Em Aberto"
2. **Ao avançar de "Em Aberto"** → Vai para "Aprovação CEO"
3. **Na etapa "Aprovação CEO"** → CEO/Diretor marca os checkboxes de revisão e aprovação
4. **Ao avançar de "Aprovação CEO"** → Vai para "Em Produção" (criando ordens de produção)
5. **Pedidos de manutenção** → Continuam indo direto para "Instalações"

## Resultado Visual

A nova aba aparecerá em todas as interfaces de gestão de pedidos, entre "Em Aberto" e "Em Produção", com contador próprio e funcionalidade completa de drag-and-drop para priorização.
