

## Plano: Criar página de Perfil do Usuário

### Mudanças

**1. Nova página**: `src/pages/MeuPerfil.tsx`
- Página com tema escuro (consistente com o resto do app)
- Exibe: foto de perfil (grande), nome, email, cargo (role), setor
- Usa o componente `AvatarUpload` existente para permitir alterar a foto
- Breadcrumb simples: "Início > Meu Perfil"
- Botão de voltar

**2. Rota no App.tsx**
- Adicionar import de `MeuPerfil`
- Adicionar rota protegida `/perfil`

**3. Menu flutuante**: `src/components/FloatingProfileMenu.tsx`
- Adicionar item "Meu Perfil" com ícone `User` antes dos outros itens do menu
- Sem verificação de permissão (todos os usuários autenticados podem acessar)

