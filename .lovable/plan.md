
# Adicionar tipo de usuario "Metamorfo"

Adicionar a opcao "Metamorfo" em todos os pontos onde os tipos de usuario sao listados/filtrados.

## Alteracoes

### 1. AdminUsersMinimalista.tsx
- Adicionar contagem `metamorfosCount`
- Adicionar terceira aba `TabsTrigger` com valor `"metamorfo"` e label "Metamorfos (X)"
- Adicionar `SelectItem value="metamorfo"` no Select de edicao inline
- Atualizar texto "Nenhum ... encontrado" para incluir metamorfo

### 2. AddUserDialog.tsx
- Adicionar `SelectItem value="metamorfo">Metamorfo</SelectItem>` no Select de tipo

### 3. UserDetailsModal.tsx
- Atualizar a logica do badge para incluir metamorfo (ternario para 3 opcoes)

### 4. Edge Function create-user (sem alteracao necessaria)
- Ja aceita qualquer string em `tipo_usuario`, nao precisa mudar

## Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminUsersMinimalista.tsx` | Nova aba, contagem, select inline |
| `src/components/AddUserDialog.tsx` | Novo SelectItem |
| `src/components/admin/UserDetailsModal.tsx` | Badge com 3 opcoes |
