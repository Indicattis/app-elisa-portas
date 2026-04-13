

## Plano: Corrigir erro React #130 na página /home/pedidos-producao

### Causa raiz
O objeto `ETAPA_ICONS` em `PedidosProducaoReadOnly.tsx` não possui todas as chaves de `ORDEM_ETAPAS`. Faltam:
- `aprovacao_diretor` (não existe no objeto)
- `instalacoes` (existe como `aguardando_instalacao`, nome errado)

Quando o Select ou TabsTrigger tenta renderizar `<IconComponent />` com valor `undefined`, o React lança o erro #130.

### Correção

**Arquivo**: `src/pages/home/PedidosProducaoReadOnly.tsx`

Atualizar `ETAPA_ICONS` (linhas 25-37):
- Adicionar `aprovacao_diretor: ShieldCheck`
- Renomear `aguardando_instalacao` para `instalacoes`
- Importar `ShieldCheck` (já importado, verificar) — sim, `ShieldCheck` já está na linha 5

```typescript
const ETAPA_ICONS = {
  aprovacao_diretor: ShieldCheck,
  aberto: Clock,
  aprovacao_ceo: ShieldCheck,
  em_producao: Factory,
  inspecao_qualidade: ClipboardCheck,
  aguardando_pintura: Paintbrush,
  embalagem: BoxIcon,
  aguardando_coleta: Package,
  instalacoes: HardHat,
  correcoes: AlertTriangle,
  finalizado: CheckCircle2
};
```

