

# Arquivar 4 pedidos presos em Instalações

## Situação atual

| Pedido ID | Número | Etapa | Arquivado |
|-----------|--------|-------|-----------|
| 127b84fd | 0169 | instalacoes | false |
| d470794a | 0208 | instalacoes | false |
| b157f1fe | 0119 | instalacoes | false |
| 4f8504ff | 0225 | instalacoes | false |

## Correção

Mesmo procedimento aplicado anteriormente aos outros 6 pedidos:

1. **Atualizar `pedidos_producao`**: Setar `etapa_atual = 'finalizado'`, `arquivado = true`, `data_arquivamento = now()` para os 4 IDs
2. **Fechar etapa `instalacoes`** em `pedidos_etapas`: Definir `data_saida = now()` onde ainda está aberta
3. **Criar/atualizar etapa `finalizado`** em `pedidos_etapas` via upsert
4. **Registrar movimentação** `instalacoes -> finalizado` (teor `avanco`) no histórico
5. **Registrar arquivamento** `finalizado -> finalizado` (teor `reorganizacao`) no histórico

Será criado um arquivo de migration SQL com todas as operações, seguindo o mesmo padrão da migration anterior (`067cc81d`).

