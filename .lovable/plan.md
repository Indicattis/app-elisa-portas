

## Plano: Nova etapa "Aprovação Diretor" e tela de aprovação

### Resumo
Adicionar uma nova etapa `aprovacao_diretor` como primeira etapa do fluxo de produção (antes de "Pedidos em Aberto"). Pedidos criados via faturamento entram nessa etapa aguardando aprovação do diretor. O diretor aprova ou reprova pela tela `/direcao/aprovacoes/pedidos`. Reprovação atualiza a venda com status "reprovado" e remove o pedido.

### Mudanças necessárias

**1. Migration SQL**
- Adicionar `aprovacao_diretor` ao fluxo: nenhuma alteração de schema necessária pois `etapa_atual` é campo texto livre
- Adicionar coluna `status_aprovacao` (text, default 'aprovado') na tabela `vendas` para marcar vendas reprovadas
- Inserir rota `direcao_aprovacoes_pedidos` em `app_routes`
- Propagar permissão para quem já tem `direcao_aprovacoes`

**2. `src/types/pedidoEtapa.ts`**
- Adicionar `'aprovacao_diretor'` ao tipo `EtapaPedido`
- Adicionar config em `ETAPAS_CONFIG` (label: "Aprovação Diretor", color: orange, icon: ShieldCheck, checkboxes: [])
- Inserir `'aprovacao_diretor'` como primeiro item de `ORDEM_ETAPAS`
- Atualizar `LIMITES_ETAPA_SEGUNDOS` com limite para a nova etapa

**3. `src/utils/pedidoFluxograma.ts`**
- Adicionar `aprovacao_diretor` ao `FLUXOGRAMA_ETAPAS`
- Incluir no fluxo base de `determinarFluxograma`

**4. `src/hooks/usePedidoCreation.ts`**
- Alterar etapa inicial de `'aberto'` para `'aprovacao_diretor'` (exceto manutenção que vai direto para instalações)

**5. `src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Adicionar `aprovacao_diretor` na lista de tabs do grupo vermelho (Produção)
- Adicionar ícone no `ETAPA_ICONS`

**6. `src/components/direcao/GestaoFabricaMobile.tsx`**
- A nova etapa já aparecerá automaticamente via `ORDEM_ETAPAS`

**7. Novo hook `src/hooks/usePedidosAprovacaoDiretor.ts`**
- Buscar pedidos com `etapa_atual = 'aprovacao_diretor'`
- Join com vendas → produtos_vendas para obter: portas (quantidade, tamanho), outros itens, preço tabela vs preço vendido
- Mutation `aprovarPedido`: avança etapa para `aberto` (via `moverParaProximaEtapa`)
- Mutation `reprovarPedido`: atualiza `vendas.status_aprovacao = 'reprovado'`, arquiva ou deleta o pedido de produção

**8. Nova página `src/pages/direcao/aprovacoes/AprovacoesPedidos.tsx`**
- Lista pedidos pendentes com informações expandidas:
  - Portas de enrolar: quantidade e tamanho (P/G/GG)
  - Outros itens (acessórios, catálogo, adicionais)
  - Preço da tabela e preço vendido de cada item
- Botões Aprovar (verde) e Reprovar (vermelho)
- Layout similar ao `AprovacoesProducao.tsx`

**9. `src/pages/direcao/aprovacoes/DirecaoAprovacoesHub.tsx`**
- Adicionar botão "Aprovações Pedidos" com ícone `ClipboardCheck` como primeiro item
- Contador de pedidos em `aprovacao_diretor`

**10. `src/App.tsx`**
- Adicionar rota `/direcao/aprovacoes/pedidos` → `AprovacoesPedidos`

**11. Faturamento Vendas**
- Na listagem `/administrativo/financeiro/faturamento/vendas`, exibir badge "Reprovado" quando `status_aprovacao = 'reprovado'` e impedir criação de novo pedido

### Arquivos alterados
- Nova migration SQL
- `src/types/pedidoEtapa.ts`
- `src/utils/pedidoFluxograma.ts`
- `src/hooks/usePedidoCreation.ts`
- `src/pages/direcao/GestaoFabricaDirecao.tsx`
- `src/pages/direcao/aprovacoes/DirecaoAprovacoesHub.tsx`
- `src/App.tsx`
- Novo: `src/hooks/usePedidosAprovacaoDiretor.ts`
- Novo: `src/pages/direcao/aprovacoes/AprovacoesPedidos.tsx`
- `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` (badge reprovado)

