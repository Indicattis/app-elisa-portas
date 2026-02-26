

# Arquivar 6 pedidos presos em Instalações

## Situação atual

Todos os 6 pedidos estão com `etapa_atual = 'instalacoes'` e `arquivado = false`:

| Pedido | Número |
|--------|--------|
| d7bc3e76 | 0201 |
| 5cb99bc7 | 0194 |
| c6c70ea4 | 0163 |
| 1fb77bf4 | 0226 |
| 33a6111d | 0193 |
| 46af161c | 0136 |

## Correção

Executar uma migration SQL que:

1. Move os 6 pedidos de `instalacoes` para `finalizado` e marca como `arquivado = true`
2. Fecha a etapa `instalacoes` (define `data_saida`)
3. Cria registro da etapa `finalizado` em `pedidos_etapas` (upsert)
4. Registra movimentação `instalacoes -> finalizado` no histórico
5. Registra movimentação de arquivamento no histórico

Arquivo: nova migration SQL com todas as operações acima.

