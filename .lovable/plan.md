

## Plano: Devolver pedido #0221 para etapa Correções

### Problema
O pedido #0221 avançou indevidamente para `finalizado` ao concluir o carregamento da correção — mesmo bug que afetou o #0088. A correção de código já foi aplicada, mas o #0221 foi afetado antes do deploy.

### Correção
Migration SQL para:
1. Buscar o pedido pelo `numero_pedido = '0221'`
2. Atualizar `pedidos_producao.etapa_atual` para `correcoes`
3. Garantir que `pedidos_etapas` de `correcoes` tenha `data_saida = NULL`
4. Fechar entrada indevida de `finalizado` em `pedidos_etapas` (se houver)
5. Registrar movimentação explicando a correção

### Detalhes técnicos
- Mesmo padrão da migration anterior do #0088
- Busca dinâmica pelo `numero_pedido` em vez de UUID hardcoded

### Arquivo
- Nova migration SQL

