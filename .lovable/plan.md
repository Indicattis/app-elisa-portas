

# Configurar limites de tempo por etapa e tempo total do pedido

## Resumo

Duas mudancas principais:
1. Cada etapa tera seu proprio limite de tempo para ficar vermelho (em horas comerciais ou dias comerciais)
2. O tempo total do pedido usara dias corridos e variara conforme o pedido tenha ou nao porta de enrolar

## Limites por etapa (tempo comercial 07:00-17:00)

| Etapa | Limite para vermelho |
|-------|---------------------|
| Aberto | 6 horas comerciais |
| Aprovacao CEO | 6 horas comerciais |
| Em Producao | 4 dias comerciais (40h) |
| Inspecao Qualidade | 3 horas comerciais |
| Aguardando Pintura | 4 dias comerciais (40h) |
| Embalagem | 3 horas comerciais |
| Expedicao Coleta | 48 dias comerciais (480h) |
| Instalacoes | 3 dias comerciais (30h) |
| Correcoes | 3 dias comerciais (30h) |

## Limites do tempo total do pedido (dias corridos)

| Tipo | Vermelho a partir de |
|------|---------------------|
| Sem porta_enrolar | 25 dias corridos |
| Com porta_enrolar | 30 dias corridos |

---

## Detalhes tecnicos

### 1. Criar mapa de limites por etapa

Arquivo: `src/types/pedidoEtapa.ts`

Adicionar um export com os limites em segundos comerciais (1 dia comercial = 10h = 36000s):

```typescript
export const LIMITES_ETAPA_SEGUNDOS: Record<EtapaPedido, number> = {
  aberto: 6 * 3600,              // 6h
  aprovacao_ceo: 6 * 3600,       // 6h
  em_producao: 4 * 10 * 3600,    // 4 dias
  inspecao_qualidade: 3 * 3600,  // 3h
  aguardando_pintura: 4 * 10 * 3600, // 4 dias
  embalagem: 3 * 3600,           // 3h
  aguardando_coleta: 48 * 10 * 3600, // 48 dias
  instalacoes: 3 * 10 * 3600,    // 3 dias
  correcoes: 3 * 10 * 3600,      // 3 dias
  finalizado: Infinity,
};
```

### 2. Atualizar `CronometroEtapaBadge`

Arquivo: `src/components/pedidos/CronometroEtapaBadge.tsx`

- Adicionar prop opcional `etapa?: EtapaPedido`
- Passar o limite para `useCronometroEtapa`

### 3. Atualizar `useCronometroEtapa`

Arquivo: `src/hooks/useCronometroEtapa.ts`

- Aceitar parametro opcional `limiteSegundos` (default: limite antigo para retrocompatibilidade)
- Usar esse limite para determinar a cor verde/vermelho

### 4. Atualizar `PedidoCard` - Badge de etapa

Arquivo: `src/components/pedidos/PedidoCard.tsx`

- Passar `etapa={etapaAtual}` para `CronometroEtapaBadge` nos dois locais (list view ~linha 1476 e grid view ~linha 1860)

### 5. Atualizar `PedidoCard` - Badge de tempo total

Arquivo: `src/components/pedidos/PedidoCard.tsx`

- Mudar `isAtrasadoTotal` para usar dias corridos em vez de horas comerciais
- Verificar se o pedido tem `porta_enrolar` nos produtos (ja existe `portasEnrolar` na linha 476)
- Usar 25 dias corridos (sem porta) ou 30 dias corridos (com porta)

Logica:
```typescript
const temPortaEnrolar = portasEnrolar.length > 0;
const LIMITE_DIAS_CORRIDOS = temPortaEnrolar ? 30 : 25;
const isAtrasadoTotal = useMemo(() => {
  if (!pedido.created_at) return false;
  const diffMs = Date.now() - new Date(pedido.created_at).getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  return diffDias >= LIMITE_DIAS_CORRIDOS;
}, [pedido.created_at, LIMITE_DIAS_CORRIDOS]);
```

### 6. Atualizar outros usos do CronometroEtapaBadge

- `GestaoFabricaMobile.tsx` (~linha 217): passar etapa
- `AprovacoesProducao.tsx` (~linha 148): sem etapa disponivel, usara default
- `NeoInstalacaoCardGestao.tsx` e `NeoCorrecaoCardGestao.tsx`: sem etapa de pedido, usara default

### 7. Horario comercial

O horario ja esta configurado como 07:00-17:00 em `calcularTempoExpediente.ts` (default `horaInicio=7, horaFim=17`). Nenhuma alteracao necessaria.

