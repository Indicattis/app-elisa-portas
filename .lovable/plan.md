

## Plano: Adicionar checklists extras nas downbars de Qualidade e Carregamento

### Contexto
- **Qualidade** usa `OrdemDetalhesSheet` — o usuário marca linhas individuais e depois clica "Concluir Ordem". Precisa de 1 checkbox extra de verificação.
- **Carregamento** usa `CarregamentoDownbar` — o usuário marca itens do pedido e depois clica "Concluir Carregamento". Precisa de 2 checkboxes extras de verificação.

### Alterações

#### 1. `src/components/production/OrdemDetalhesSheet.tsx`

Quando `tipoOrdem === 'qualidade'`:
- Adicionar estado `checklistExtra` com 1 item: `"Verifiquei que a testeira é compatível com motor"`
- Renderizar seção de checklist extra acima do botão "Concluir Ordem" (após os itens de linha)
- O botão "Concluir Ordem" só fica habilitado quando todas as linhas E o checklist extra estiverem marcados

#### 2. `src/components/carregamento/CarregamentoDownbar.tsx`

- Adicionar estado `checklistExtra` com 2 itens:
  - `"Verifiquei que a testeira é compatível com motor"`
  - `"Placa Soleira Elisa"`
- Renderizar seção "Verificações" entre os itens do carregamento e os botões
- O botão "Concluir Carregamento" só fica habilitado quando todos os itens E todos os checkboxes extras estiverem marcados (atualizar condição `todosMarcados`)

### Comportamento
- Os checkboxes extras são locais (não persistidos no banco) — resetam ao fechar a downbar
- Visual consistente com os checkboxes de itens existentes, mas com seção separada "Verificações"
- Cor diferenciada (amber/warning) para distinguir das linhas de produto

