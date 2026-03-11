

## Correção: Coluna `cargo` da tabela `vagas` usa enum `user_role` fixo

### Problema
A tabela `vagas` tem a coluna `cargo` tipada como `user_role` (enum PostgreSQL). Quando o usuário cria uma função dinâmica (ex: "designer") via `system_roles`, ela não existe no enum, causando o erro `invalid input value for enum user_role: "designer"`.

### Solução
Alterar a coluna `cargo` de `user_role` para `text`, permitindo qualquer valor de role (inclusive os criados dinamicamente).

### Mudanças

**1. Migration SQL**
- `ALTER TABLE public.vagas ALTER COLUMN cargo TYPE text;`

**2. `src/hooks/useVagas.ts`**
- Mudar os tipos `UserRole` e `VagaFormData` para usar `string` em vez do enum hardcoded para o campo `cargo`.
- `cargo: string` na interface `Vaga` e `VagaFormData`.

