

# Detalhes de Correcao para Pedidos na Etapa "Correcoes"

## Resumo

Quando um pedido estiver na etapa "Correcoes" em `/logistica/expedicao`, o usuario podera clicar nele e acessar um formulario para registrar os detalhes da correcao: linhas de itens para correcao, justificativa escrita, custo da correcao e setor responsavel pela causa.

## Alteracoes no Banco de Dados

### 1. Adicionar colunas na tabela `correcoes`

A tabela `correcoes` ja possui `observacoes`, mas precisa de novas colunas:

- `custo_correcao` (numeric, default 0) - Valor do custo da correcao
- `setor_causador` (text, nullable) - Setor responsavel pela causa (vendas, fabrica, instalacoes, etc.)
- `justificativa` (text, nullable) - Descricao detalhada do problema/justificativa
- `etapa_causadora` (text, nullable) - Etapa do fluxo que causou o problema (aberto, em_producao, etc.)

### 2. Criar tabela `correcao_linhas`

Nova tabela para registrar os itens/linhas que precisam de correcao:

```text
correcao_linhas
  id            uuid PK (gen_random_uuid)
  correcao_id   uuid FK -> correcoes.id ON DELETE CASCADE
  descricao     text NOT NULL (descricao do item/problema)
  quantidade    integer DEFAULT 1
  created_at    timestamptz DEFAULT now()
```

RLS: mesma politica da tabela `correcoes` (authenticated users com full access).

## Alteracoes no Frontend

### 3. Criar componente `CorrecaoDetalhesSheet`

Novo componente Sheet (sidebar lateral) que abre ao clicar em um pedido na etapa "correcoes". Contera:

- **Cabecalho**: numero do pedido, nome do cliente
- **Secao "Linhas de Correcao"**: lista editavel de itens com botao para adicionar novas linhas (descricao + quantidade)
- **Campo "Justificativa"**: textarea para descrever o problema
- **Campo "Custo da Correcao"**: input numerico formatado como moeda
- **Campo "Setor Responsavel"**: select com opcoes (Vendas, Fabrica, Instalacoes, Marketing, Administrativo)
- **Campo "Etapa Causadora"**: select com as etapas do fluxo de producao
- **Botao Salvar**: persiste tudo no banco

Arquivo: `src/components/pedidos/CorrecaoDetalhesSheet.tsx`

### 4. Integrar na `ExpedicaoMinimalista.tsx`

- Adicionar estado para controlar abertura do sheet de detalhes de correcao
- Quando `etapaAtiva === 'correcoes'` e o usuario clicar num pedido, abrir o `CorrecaoDetalhesSheet` em vez do (ou alem do) `PedidoDetalhesSheet` padrao
- Passar os dados do pedido e da correcao vinculada (busca na tabela `correcoes` pelo `pedido_id`)

### 5. Criar hook `useCorrecaoDetalhes`

Hook para buscar e salvar os dados de correcao de um pedido:

- Buscar a correcao vinculada ao `pedido_id`
- Buscar as linhas de correcao vinculadas
- Mutation para atualizar custo, setor, justificativa, etapa_causadora
- Mutation para adicionar/remover linhas de correcao

Arquivo: `src/hooks/useCorrecaoDetalhes.ts`

## Secao Tecnica

### Fluxo de Dados

1. Usuario clica no card do pedido na aba "Correcoes"
2. Sistema busca o registro da tabela `correcoes` onde `pedido_id` = id do pedido
3. Sistema busca `correcao_linhas` vinculadas
4. Abre o Sheet lateral com formulario preenchido (ou vazio se primeira vez)
5. Usuario preenche/edita e clica em Salvar
6. Sistema faz upsert na tabela `correcoes` e insere/deleta linhas em `correcao_linhas`

### Componentes envolvidos

- `src/components/pedidos/CorrecaoDetalhesSheet.tsx` (novo)
- `src/hooks/useCorrecaoDetalhes.ts` (novo)
- `src/pages/logistica/ExpedicaoMinimalista.tsx` (editado - integrar abertura do sheet)
- `src/components/pedidos/PedidoCard.tsx` (possivelmente editado - abrir sheet de correcao quando etapa = correcoes)
- Migration SQL para novas colunas e tabela

