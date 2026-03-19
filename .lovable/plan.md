

## Plano: Adicionar seção de alteração de senha em /perfil

### Arquivo: `src/pages/MeuPerfil.tsx`

Adicionar uma nova seção abaixo das informações do usuário com:

- Título "Alterar Senha"
- Campo "Senha atual" (type password)
- Campo "Nova senha" (type password)
- Campo "Confirmar nova senha" (type password)
- Botão "Salvar nova senha"
- Validações: senha mínima 6 caracteres, confirmação deve coincidir
- Usa `supabase.auth.updateUser({ password })` para alterar
- Toast de sucesso/erro
- Ícone de cadeado (`Lock`) no título da seção

### Detalhes técnicos

- Não precisa de edge function — o método `updateUser` do Supabase já permite que o usuário autenticado altere sua própria senha
- A "senha atual" será verificada via `signInWithPassword` antes de aplicar a mudança (para confirmar identidade)
- Campos limpos após sucesso

