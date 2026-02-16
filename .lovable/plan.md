

# Atualizar cores dos cronometros dos pedidos

## Resumo
Duas alteracoes nos limites de cor dos cronometros na pagina de gestao de fabrica:

1. **Cronometro da etapa**: ficar vermelho apos **5 dias uteis** (atualmente esta em 10 dias)
2. **Cronometro total do pedido**: ficar vermelho apos **10 dias uteis** (atualmente nao tem logica de cor)

## Alteracoes

### 1. `src/hooks/useCronometroEtapa.ts`
Reduzir o `LIMITE_VERDE` de 10 dias uteis (360.000 segundos) para 5 dias uteis (180.000 segundos):
```
const LIMITE_VERDE = 5 * 10 * 60 * 60; // 5 dias uteis * 10h/dia = 50h = 180000 segundos
```

### 2. `src/components/pedidos/PedidoCard.tsx`
Adicionar logica de cor ao Badge do tempo total (criacao do pedido), nos dois locais (desktop e mobile):

- Calcular os segundos de expediente desde `pedido.created_at` usando `calcularTempoExpediente`
- Se >= 10 dias uteis (360.000 segundos): aplicar classes vermelhas (`bg-red-500/10 text-red-500 border-red-500/30`)
- Caso contrario: manter o estilo atual (`bg-muted/50 text-muted-foreground`)

Sera necessario importar `calcularTempoExpediente` e usar um estado/memo para calcular o tempo decorrido em segundos de expediente desde a criacao do pedido.

## Arquivos alterados
- `src/hooks/useCronometroEtapa.ts` - alterar limite de 10 para 5 dias
- `src/components/pedidos/PedidoCard.tsx` - adicionar cor vermelha condicional no badge de tempo total

