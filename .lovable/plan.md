

# Seção de Rascunhos Salvos na Folha de Pagamento

## Resumo
Adicionar uma seção logo abaixo do header (antes da configuração) que lista todas as folhas de pagamento com `status = "rascunho"`. Cada rascunho exibe o mês de referência, data de criação e total parcial. Ao clicar, o mês é selecionado automaticamente, carregando o rascunho existente.

## Mudanças em `src/pages/FolhaPagamentoNova.tsx`

### 1. Nova query para listar todos os rascunhos
- Buscar `folhas_pagamento` com `status = 'rascunho'`, selecionando `id, mes_referencia, total_liquido, created_at, observacoes`.
- Ordenar por `mes_referencia` desc.

### 2. Seção visual entre o header e a configuração (linha ~449)
- Card glassmorphism (`bg-white/5 border-white/10`) com título "Rascunhos Salvos" e ícone `Save`.
- Lista horizontal/grid de rascunhos, cada um como um mini-card clicável com:
  - Mês de referência formatado (ex: "Fevereiro de 2026")
  - Total líquido parcial
  - Data de última edição
- Ao clicar: `setMesReferencia(new Date(rascunho.mes_referencia))` — a query existente de `folha-rascunho` já carrega os dados automaticamente.
- Esconder a seção se não houver rascunhos.

### 3. Indicador visual no rascunho ativo
- Destacar o rascunho selecionado (borda amber) quando o `mesReferencia` corresponder.

