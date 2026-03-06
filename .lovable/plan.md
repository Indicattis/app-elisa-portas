

# Salvar Folha de Pagamento como Rascunho

## Resumo
Permitir que o usuário salve a folha de pagamento como rascunho (status "rascunho") sem gerar contas a pagar, podendo retomar o preenchimento depois. Ao acessar a página, se existir um rascunho para o mês selecionado, os dados são carregados automaticamente.

## Mudanças no banco de dados
Nenhuma. A tabela `folhas_pagamento` já possui coluna `status` (string) e `folha_pagamento_itens` já suporta todos os campos. Basta usar `status: "rascunho"` em vez de `"finalizada"`.

## Mudanças em `src/pages/FolhaPagamentoNova.tsx`

### 1. Carregar rascunho existente
- Adicionar query que busca `folhas_pagamento` com `status = 'rascunho'` para o `mesReferencia` selecionado.
- Se encontrar, carregar os dados da folha (observações, data de vencimento) e seus itens (`folha_pagamento_itens`), preenchendo o state `itens` com os valores salvos.
- Guardar o `rascunhoId` em state para saber se é update ou insert.

### 2. Mutation de salvar rascunho
- Criar `salvarRascunhoMutation` que:
  - Se `rascunhoId` existe: faz UPDATE na `folhas_pagamento` e DELETE + INSERT nos itens.
  - Se não existe: faz INSERT com `status: "rascunho"` e insere os itens (sem criar contas a pagar).
- Toast de sucesso: "Rascunho salvo com sucesso".

### 3. Ajustar lógica de finalizar
- Se finalizando a partir de um rascunho, fazer UPDATE do status para "finalizada" em vez de INSERT novo.

### 4. Ajustar filtro de meses preenchidos
- Mudar a query de `mesesPreenchidos` para filtrar apenas `status = 'finalizada'`, permitindo que meses com rascunho continuem selecionáveis.

### 5. Adicionar botão "Salvar Rascunho"
- Novo botão entre "Cancelar" e "Finalizar", com estilo amber/yellow para diferenciar.
- Ícone `Save`.

## Fluxo
1. Usuário acessa a folha → se há rascunho do mês, carrega automaticamente.
2. Preenche dados → clica "Salvar Rascunho" → salva sem gerar contas.
3. Pode sair e voltar depois → rascunho carrega de novo.
4. Quando pronto, clica "Finalizar" → gera contas a pagar normalmente.

