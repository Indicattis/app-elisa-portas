

# Criar página de Folha de Pagamento minimalista + integração com DRE

## Problema
O botão "Gerar Folha" navega para `/dashboard/administrativo/rh/colaboradores/folha-pagamento` — rota que não existe no sistema novo. A página `FolhaPagamentoNova.tsx` existe mas usa o layout antigo e não está roteada.

## Plano

### 1. Criar nova página minimalista
Criar `src/pages/administrativo/rh-dp/FolhaPagamentoMinimalista.tsx` baseada na lógica de `FolhaPagamentoNova.tsx`, mas:
- Usar `MinimalistLayout` com breadcrumb (Home > Administrativo > RH/DP > Colaboradores > Folha de Pagamento)
- Estilo dark/glass (bg-white/5, border-white/10, text-white)
- Mesma funcionalidade: selecionar mês, data vencimento, tabela de colaboradores em folha com horas extras/acréscimos/descontos
- Botão "Finalizar" que gera folha + contas a pagar

### 2. Integração com DRE (folha_salarial)
Ao finalizar a folha, além de criar registros em `folhas_pagamento`, `folha_pagamento_itens` e `contas_pagar`, **inserir uma despesa em `despesas_mensais`** com:
- `modalidade = 'folha_salarial'`
- `nome = 'Folha de Pagamento - [Mês/Ano]'`
- `valor = totais.totalLiquido`
- `mes_referencia = [mês selecionado no formato YYYY-MM]`
- `status = 'decretada'`

Isso faz com que o valor apareça automaticamente na seção "Folha Salarial" do DRE mensal.

### 3. Rota + navegação
- Adicionar rota `/administrativo/rh-dp/colaboradores/folha-pagamento` no `App.tsx`
- Atualizar o botão em `ColaboradoresMinimalista.tsx` para navegar para a nova rota

### 4. Arquivos alterados
- **Novo**: `src/pages/administrativo/rh-dp/FolhaPagamentoMinimalista.tsx`
- **Editar**: `src/App.tsx` (importar + rota)
- **Editar**: `src/pages/administrativo/ColaboradoresMinimalista.tsx` (corrigir path do navigate)

