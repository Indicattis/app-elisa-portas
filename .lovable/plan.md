
# Pedidos sem pintura devem pular embalagem

## Resumo
Alterar a logica de avanço para que pedidos sem pintura pulem a etapa de embalagem, indo direto para `aguardando_coleta` ou `instalacoes` conforme o tipo de entrega. Alem disso, mover os 4 pedidos atualmente presos na embalagem para suas respectivas proximas etapas.

## O que muda para o usuario
- Pedidos sem pintura nao aparecerão mais na etapa de embalagem
- Apos a inspeção de qualidade, esses pedidos irao direto para expedição (coleta) ou instalações
- Os 4 pedidos atuais na embalagem serao movidos automaticamente

## Pedidos a mover
| Pedido | Tipo Entrega | Destino |
|--------|-------------|---------|
| 0189   | entrega     | aguardando_coleta |
| 0194   | instalacao  | instalacoes |
| 0216   | instalacao  | instalacoes |
| 0217   | entrega     | aguardando_coleta |

## Alteracoes

### 1. Migração SQL - Mover os 4 pedidos
Executar migracao para:
- Fechar a etapa `embalagem` (setar `data_saida`) dos 4 pedidos
- Criar/upsert a etapa destino correta para cada pedido (`aguardando_coleta` ou `instalacoes`)

### 2. `src/utils/pedidoFluxograma.ts` - Atualizar fluxograma visual
Na funcao `determinarFluxograma`, a embalagem so deve ser adicionada ao fluxo quando o pedido tem pintura (linha 114-115):

```
// Antes: embalagem é obrigatória para todos
baseFlow.push(FLUXOGRAMA_ETAPAS.embalagem);

// Depois: embalagem apenas quando tem pintura
if (temPintura) {
  baseFlow.push(FLUXOGRAMA_ETAPAS.embalagem);
}
```

### 3. `src/hooks/usePedidosEtapas.ts` - Logica de avanço
Na secao que determina o destino ao sair de `inspecao_qualidade` (linhas 715-740), alterar o else (sem pintura) para verificar `tipo_entrega` e ir para `aguardando_coleta` ou `instalacoes` em vez de `embalagem`.

### Arquivos envolvidos
- Migracao SQL (mover pedidos existentes)
- `src/utils/pedidoFluxograma.ts` (fluxograma visual)
- `src/hooks/usePedidosEtapas.ts` (logica de avanço)
