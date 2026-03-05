

# Bloquear meses já preenchidos na seleção de referência

## Problema
O select de "Mês de Referência" permite selecionar meses que já possuem folha de pagamento finalizada na tabela `folhas_pagamento`.

## Solução
No `FolhaPagamentoNova.tsx`:

1. **Query para buscar meses já usados**: Adicionar uma query que busca todos os `mes_referencia` distintos da tabela `folhas_pagamento` e armazena num Set.

2. **Desabilitar meses no Select**: No loop de `mesesDisponiveis`, verificar se o mês já existe no Set. Se sim, desabilitar o `SelectItem` com `disabled={true}` e adicionar um indicador visual (ex: texto " (já preenchido)").

3. **Auto-selecionar mês válido**: Se o mês atual já estiver preenchido, selecionar automaticamente o próximo mês disponível.

### Mudanças no arquivo `src/pages/FolhaPagamentoNova.tsx`:

- Adicionar query `folhas_existentes` que faz `SELECT mes_referencia FROM folhas_pagamento`
- Criar um `Set<string>` com os meses no formato `yyyy-MM`
- No `SelectItem`, adicionar `disabled` quando o mês está no Set
- Ajustar o estado inicial de `mesReferencia` para o primeiro mês não preenchido

