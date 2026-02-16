

# Pedido de Correcao a partir de Pedido Existente

## Resumo
Criar a funcionalidade de gerar um "pedido de correcao" vinculado a um pedido existente que apresentou problemas. O pedido de correcao e um pedido completo (com linhas, ordens, fluxo normal), mas com sinalizacao visual roxa em /direcao/gestao-fabrica.

## Etapas

### 1. Adicionar colunas no banco de dados (migracao)
Adicionar campos na tabela `pedidos_producao` para identificar pedidos de correcao:
- `is_correcao` (boolean, default false) - marca que e um pedido de correcao
- `pedido_origem_id` (uuid, nullable, FK para pedidos_producao) - referencia ao pedido original que gerou a correcao

```sql
ALTER TABLE pedidos_producao ADD COLUMN is_correcao boolean DEFAULT false;
ALTER TABLE pedidos_producao ADD COLUMN pedido_origem_id uuid REFERENCES pedidos_producao(id);
```

### 2. Criar hook `useCriarPedidoCorrecao`
Novo hook em `src/hooks/useCriarPedidoCorrecao.ts` que:
- Recebe o `pedido_id` do pedido original
- Busca os dados do pedido original (cliente, endereco, venda_id, etc.)
- Gera um novo numero de pedido (sequencial)
- Cria o pedido em `pedidos_producao` com `is_correcao: true` e `pedido_origem_id` apontando para o original
- Cria a etapa inicial "aberto" em `pedidos_etapas`
- Registra movimentacao no historico
- Retorna o ID do novo pedido para que o usuario possa preencher as linhas

### 3. Criar modal de criacao do pedido de correcao
Novo componente `src/components/pedidos/CriarPedidoCorrecaoModal.tsx`:
- Acionado a partir do PedidoCard ou PedidoDetalhesSheet
- Exibe o nome do cliente e numero do pedido original (somente leitura)
- Campo opcional para observacoes/descricao do problema
- Ao confirmar, chama o hook e redireciona para a pagina de preenchimento do pedido

### 4. Adicionar botao "Gerar Correcao" no PedidoCard
Em `src/components/pedidos/PedidoCard.tsx`:
- Adicionar opcao no menu de acoes ou botao dedicado para gerar pedido de correcao
- Disponivel em etapas apos producao (inspecao_qualidade, embalagem, instalacoes, finalizado, etc.)
- Abre o modal de criacao

### 5. Sinalizacao visual roxa em /direcao/gestao-fabrica
Em `src/components/pedidos/PedidoCard.tsx` (modo lista):
- Quando `pedido.is_correcao === true`, aplicar borda esquerda roxa e badge "CORRECAO" roxo
- Usar o mesmo estilo roxo (#9333ea) utilizado nos NeoCorrecaoCardGestao

Em `src/components/pedidos/PedidosDraggableList.tsx`:
- Nenhuma alteracao necessaria, pois o PedidoCard ja recebe o objeto pedido completo

### 6. Atualizar query de pedidos para incluir novos campos
Em `src/hooks/usePedidosEtapas.ts`:
- Os novos campos `is_correcao` e `pedido_origem_id` ja serao retornados pelo `select(*)`, nao requer alteracao na query

## Secao tecnica

### Migracao SQL
```sql
ALTER TABLE pedidos_producao ADD COLUMN is_correcao boolean DEFAULT false;
ALTER TABLE pedidos_producao ADD COLUMN pedido_origem_id uuid REFERENCES pedidos_producao(id);
```

### Fluxo do pedido de correcao
1. Usuario clica "Gerar Correcao" em um pedido existente
2. Modal abre com dados do cliente pre-preenchidos
3. Ao confirmar, pedido e criado na etapa "aberto" com `is_correcao=true`
4. Usuario preenche as linhas/ordens como em um pedido normal
5. Pedido segue o fluxo padrao (aberto -> aprovacao_ceo -> producao -> ...)
6. Na listagem de gestao, aparece com sinalizacao roxa

### Arquivos novos
- `src/hooks/useCriarPedidoCorrecao.ts`
- `src/components/pedidos/CriarPedidoCorrecaoModal.tsx`

### Arquivos alterados
- `src/components/pedidos/PedidoCard.tsx` - botao de gerar correcao + sinalizacao visual roxa
- `src/components/pedidos/PedidoDetalhesSheet.tsx` - opcao de gerar correcao (opcional)

