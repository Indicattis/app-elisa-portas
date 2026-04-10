

## Plano: Avançar pedidos #0298 e #0309 para Instalações

### Contexto
Ambos os pedidos estão em `inspecao_qualidade` mas deveriam estar em `instalacoes`. Cada um possui uma ordem de qualidade pendente (`status: pendente`) que nunca foi concluída. O fluxo correto para ambos (que têm pintura e tipo_entrega=instalação) é: `inspecao_qualidade → aguardando_pintura → embalagem → instalacoes`.

### O que será feito

**Migration SQL** que, para cada pedido (#0298 e #0309):

1. Concluir a ordem de qualidade pendente (`ordens_qualidade`) marcando `status = 'concluido'`, `historico = true`
2. Fechar a etapa atual em `pedidos_etapas` (setar `data_saida`)
3. Criar/reativar registros de etapas intermediárias (`aguardando_pintura`, `embalagem`) com `data_entrada` e `data_saida` preenchidos (passagem instantânea)
4. Criar/reativar registro da etapa `instalacoes` com `data_entrada` e sem `data_saida`
5. Atualizar `pedidos_producao.etapa_atual = 'instalacoes'`
6. Registrar movimentações em `pedidos_movimentacoes` para cada transição (inspecao_qualidade → aguardando_pintura → embalagem → instalacoes)
7. Criar registro na tabela `instalacoes` (já que ambos não possuem) com os dados do pedido/venda

### Detalhes técnicos
- IDs dos pedidos: `4a7e6af8-7d58-4ccf-8fc7-5441cf5098a2` (#0298) e `08e4eddf-ca28-40c8-9b86-150db8fdf18b` (#0309)
- Usar UPSERT (`ON CONFLICT`) em `pedidos_etapas` para respeitar a constraint unique `(pedido_id, etapa)`
- As ordens de pintura e embalagem não serão criadas (apenas o registro de passagem pela etapa)

### Arquivo
- Nova migration SQL

