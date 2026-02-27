

# Melhorar mensagens de erro no AddUserDialog

## Problema

Quando a Edge Function retorna um erro 400 (ex: email duplicado), o `supabase.functions.invoke` lanca um `FunctionsHttpError` generico. O `error.message` nao contem a mensagem real do JSON retornado pela funcao -- ele so diz "Edge Function returned a non-2xx status code". A mensagem util (como "A user with this email address has already been registered") se perde.

## Solucao

Atualizar o `handleSubmit` no `AddUserDialog.tsx` para:

1. **Extrair o corpo da resposta de erro**: O `FunctionsHttpError` tem um metodo `context` com o response. Precisamos ler o JSON do response para obter a mensagem real.
2. **Mapear mensagens em ingles para portugues**: Traduzir mensagens comuns do Supabase Auth para mensagens amigaveis em portugues.
3. **Exibir mensagens claras no toast**: Mostrar a mensagem traduzida ao usuario.

## Detalhes tecnicos

### Arquivo: `src/components/AddUserDialog.tsx`

Alterar o bloco try/catch (linhas 57-96) para:

- Ao chamar `supabase.functions.invoke`, verificar se `error` existe e tentar extrair o JSON do response com `error.context?.json()` ou verificar se `data` contem o erro
- Criar um mapa de traducao de erros comuns:
  - `"A user with this email address has already been registered"` -> `"Este email ja esta cadastrado no sistema. Edite o usuario existente para alterar suas informacoes."`
  - `"Missing required fields"` -> `"Preencha todos os campos obrigatorios (nome, email, senha e funcao)."`
  - `"Insufficient permissions"` -> `"Voce nao tem permissao para criar usuarios."`
  - `"Invalid or expired token"` -> `"Sua sessao expirou. Faca login novamente."`
- Fallback para a mensagem original caso nao haja traducao

### Arquivo: `supabase/functions/create-user/index.ts`

Nenhuma alteracao necessaria -- a Edge Function ja retorna mensagens claras no JSON. O problema e apenas no frontend que nao le essas mensagens.

