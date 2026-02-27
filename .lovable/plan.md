
# Segregar usuarios em Colaboradores e Representantes

## 1. Alteracao no banco de dados

Adicionar coluna `tipo_usuario` na tabela `admin_users` com tipo TEXT e default `'colaborador'` (para nao quebrar usuarios existentes).

```sql
ALTER TABLE admin_users ADD COLUMN tipo_usuario text NOT NULL DEFAULT 'colaborador';
```

Nao sera criado um enum para manter consistencia com o padrao do projeto (roles tambem sao TEXT com FK).

## 2. Interface /admin/users com abas

Substituir a lista unica por duas abas (Tabs) usando o componente Radix Tabs ja instalado:

- **Colaboradores**: Filtra `tipo_usuario = 'colaborador'` (comportamento atual)
- **Representantes**: Filtra `tipo_usuario = 'representante'`

Cada aba mantera os mesmos filtros (busca, status, setor, funcao) e acoes (editar, reset senha, detalhes).

## 3. Dialogo de criacao de usuario (AddUserDialog)

Adicionar campo `tipo_usuario` ao formulario com um Select entre "Colaborador" e "Representante". O valor sera enviado junto na chamada da Edge Function `create-user`.

## 4. Edge Function create-user

Atualizar para aceitar e persistir o campo `tipo_usuario` ao criar o registro em `admin_users`.

## 5. Edicao de usuario

Permitir alterar `tipo_usuario` na edicao inline e no formulario de edicao, adicionando um Select ou Toggle ao lado dos campos existentes.

## 6. Detalhes do usuario (UserDetailsModal)

Exibir badge indicando se e "Colaborador" ou "Representante".

## Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Adicionar coluna `tipo_usuario` |
| `src/pages/admin/AdminUsersMinimalista.tsx` | Adicionar Tabs, filtro por tipo, campo de edicao |
| `src/components/AddUserDialog.tsx` | Adicionar campo tipo_usuario ao form |
| `supabase/functions/create-user/index.ts` | Aceitar e persistir tipo_usuario |
| `src/components/admin/UserDetailsModal.tsx` | Exibir tipo_usuario |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente |
