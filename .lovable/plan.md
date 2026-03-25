

## Plano: Permitir cadastrar vendas a partir de rascunhos

### Problema
Quando um vendedor clica "Continuar" em um rascunho, abre a página de edição (`MinhasVendasEditar`), que só tem um botão "Salvar" que navega de volta sem nunca mudar `is_rascunho` para `false`. Não existe botão para finalizar/cadastrar o rascunho como venda real.

### Solução
Adicionar um botão "Cadastrar Venda" na página `MinhasVendasEditar` que:
1. Executa as validações obrigatórias (endereço completo, produtos, comprovante se aplicável)
2. Atualiza `is_rascunho = false` no banco de dados
3. Recalcula e atualiza os totais da venda (`valor_venda`, `valor_a_receber`, etc.)
4. Invalida as queries de rascunhos e vendas

### Arquivos alterados
- `src/pages/vendas/MinhasVendasEditar.tsx` — Adicionar botão "Cadastrar Venda" e lógica de finalização

### Detalhes técnicos

**Nova função `handleCadastrarVenda`** em `MinhasVendasEditar.tsx`:
- Validar campos obrigatórios: `estado`, `cidade`, `cep`, `bairro`, `endereco`, e pelo menos 1 produto
- Recalcular `valor_venda` com base nos produtos atuais + frete + crédito
- Executar `supabase.from('vendas').update({ is_rascunho: false, valor_venda: ..., valor_a_receber: ... }).eq('id', id)`
- Invalidar queries `['vendas']`, `['rascunhos-vendas']`, `['minhas-vendas']`
- Navegar para `/vendas/minhas-vendas` com toast de sucesso

**Botão na UI**: Ao lado do "Salvar", adicionar botão verde/destaque "Cadastrar Venda" visível apenas quando `venda.is_rascunho === true`.

