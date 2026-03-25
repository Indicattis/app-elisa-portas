

## Plano: Corrigir registro de venda a partir de rascunho

### Problema identificado

Ao analisar o código de `MinhasVendasEditar.tsx`, identifiquei que a função `handleSalvar` (botão "Salvar") **não faz nenhuma chamada ao banco** — ela apenas exibe um toast e navega de volta. Por isso, "salvar" sempre funciona.

Já a função `handleCadastrarVenda` (botão "Cadastrar Venda") faz um `UPDATE` real no Supabase para definir `is_rascunho: false`. Se o RLS bloquear esse update silenciosamente, o Supabase retorna `{ data: null, error: null }` — sem erro, mas sem atualizar nada. O código atual só verifica `error`, então parece ter sucesso mas o rascunho não é convertido.

A causa raiz provável: o update pode estar falhando silenciosamente via RLS, ou a validação de campos obrigatórios (estado, cidade, CEP, bairro) está bloqueando sem que o toast de erro seja visível para o usuário.

### Correções

**1. Adicionar verificação de resultado no update**

Na função `handleCadastrarVenda`, adicionar `.select()` ao update e verificar se dados foram retornados:

```typescript
const { data, error } = await supabase
  .from('vendas')
  .update({ is_rascunho: false, valor_venda: valorVenda, valor_a_receber: valorAReceber })
  .eq('id', id)
  .select()
  .single();

if (error) throw error;
if (!data) throw new Error('Não foi possível atualizar a venda. Verifique suas permissões.');
```

**2. Melhorar feedback de validação**

Tornar as mensagens de validação mais visíveis e adicionar scroll para o campo faltante, para que o usuário entenda o que está impedindo o registro.

**3. Garantir que o botão "Cadastrar Venda" é visível e clicável**

Verificar que o estado `venda.is_rascunho` está sendo lido corretamente do banco e que o botão aparece para rascunhos.

### Detalhes técnicos

- Arquivo alterado: `src/pages/vendas/MinhasVendasEditar.tsx`
- Função afetada: `handleCadastrarVenda` (linhas 387-452)
- A adição de `.select().single()` permite detectar quando o RLS bloqueia silenciosamente o update
- Nenhuma alteração de RLS é necessária — as políticas atuais permitem update para usuários autenticados

