

# Integrar Terceirizacao (Porta Social) ao fluxo de producao

## Contexto

Atualmente, a ordem de porta social (`ordens_porta_social`) e criada corretamente quando o pedido avanca para "Em Producao", mas ela e tratada de forma isolada -- sua conclusao nao impede o avanco do pedido, nao aparece no progresso geral, e seus itens nao sao incluidos na pintura.

## Problemas identificados

1. **Avanco ignora porta social**: A funcao `verificarOrdensProducaoConcluidas` em `usePedidoAutoAvanco.ts` so verifica soldagem, perfiladeira e separacao. A ordem de porta social nao e considerada.

2. **Tipo `porta_social` nao existe no tipo `TipoOrdem`**: O tipo e `'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura'`. A pagina de terceirizacao usa `as any` para contornar isso.

3. **Auto-avanco rejeita `porta_social`**: Quando o tipo de ordem concluida e `porta_social`, o `tentarAvancoAutomatico` ignora porque nao esta na lista `['soldagem', 'perfiladeira', 'separacao']`.

4. **Progresso nao inclui porta social**: `useOrdemProgress.ts` nao consulta `ordens_porta_social`.

5. **Pintura nao inclui itens de porta social**: `criar_ordem_pintura` busca linhas apenas de `tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')`.

6. **Pagina de terceirizacao sem informacoes detalhadas**: A pagina atual so mostra delegar/concluir, sem as informacoes detalhadas que as demais producoes exibem (linhas do pedido, observacoes de visita, cores, produtos, etc.).

## Solucao

### 1. Adicionar `porta_social` ao tipo `TipoOrdem` e ao fluxo de verificacao

**Arquivo: `src/hooks/usePedidoAutoAvanco.ts`**

- Linha 7: Adicionar `'porta_social'` ao tipo `TipoOrdem`
- Na funcao `verificarOrdensProducaoConcluidas`: apos verificar soldagem/perfiladeira/separacao, adicionar verificacao de `ordens_porta_social` (status deve ser `concluido`)
- Linha 296: Incluir `'porta_social'` na lista de tipos que disparam verificacao em `em_producao`

### 2. Incluir porta social no progresso do pedido

**Arquivo: `src/hooks/useOrdemProgress.ts`**

- Adicionar consulta a `ordens_porta_social` no `Promise.all`
- Incluir no array de ordens para calculo de progresso

### 3. Incluir itens de porta social na pintura (SQL)

**Nova migracao SQL**

Atualizar a funcao `criar_ordem_pintura` para tambem buscar itens de `pedido_linhas` que pertencem a porta social (`categoria_linha` correspondente ou produto com `tipo_produto = 'porta_social'`). Os itens da porta social que requerem pintura devem aparecer nas linhas da ordem de pintura.

Como a porta social nao gera `linhas_ordens` no fluxo de producao padrao (ela e uma ordem sem linhas detalhadas), a pintura precisa buscar diretamente de `pedido_linhas` os itens com `categoria_linha` que correspondem a porta social e cujo estoque tem `requer_pintura = true`.

### 4. Enriquecer a pagina de terceirizacao com informacoes do pedido

**Arquivo: `src/components/production/ProducaoTerceirizacaoKanban.tsx`**

Adicionar ao card de cada ordem:
- Icones dos tipos de produto do pedido (componente `ProdutosIcons`)
- Cores das portas de enrolar (componente `CoresPortasEnrolar`)
- Progresso geral do pedido (componente via `useOrdemProgress`)
- Observacoes da venda (ja parcialmente exibidas)
- Lista das linhas do pedido (itens que compoe a porta social)

**Arquivo: `src/hooks/useOrdemPortaSocial.ts`**

Enriquecer a query para trazer tambem os dados de `produtos_vendas` (tipos de produto, cores) e as `pedido_linhas` associadas, para poder exibir informacoes completas no card.

### 5. Remover `as any` da pagina de terceirizacao

**Arquivos: `src/pages/ProducaoTerceirizacao.tsx` e `src/pages/fabrica/producao/TerceirizacaoMinimalista.tsx`**

Remover o cast `'porta_social' as any` agora que o tipo sera adicionado a `TipoOrdem`.

### 6. Ajustar retrocesso para porta social

Verificar que a funcao `retroceder_pedido_unificado` ja lida com `ordens_porta_social` (confirmado: ja faz `DELETE FROM ordens_porta_social`). Nenhuma alteracao necessaria aqui.

## Arquivos modificados

1. **Editar**: `src/hooks/usePedidoAutoAvanco.ts` -- adicionar `porta_social` ao tipo e a verificacao
2. **Editar**: `src/hooks/useOrdemProgress.ts` -- incluir `ordens_porta_social`
3. **Editar**: `src/components/production/ProducaoTerceirizacaoKanban.tsx` -- enriquecer cards com info do pedido
4. **Editar**: `src/hooks/useOrdemPortaSocial.ts` -- trazer dados adicionais (produtos, cores)
5. **Editar**: `src/pages/ProducaoTerceirizacao.tsx` -- remover `as any`
6. **Editar**: `src/pages/fabrica/producao/TerceirizacaoMinimalista.tsx` -- remover `as any`
7. **Nova migracao SQL**: atualizar `criar_ordem_pintura` para incluir itens de porta social

