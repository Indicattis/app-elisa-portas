

## Plano: Adicionar criação e edição de funções na página de Vagas

### Mudanças

**Arquivo: `src/pages/administrativo/VagasPage.tsx`**

1. **Imports**: Adicionar `CreateRoleModal`, `EditRoleModal`, e `Pencil` icon
2. **Estados**: Adicionar `createRoleModalOpen` e `editingRole` (mesmo padrão do GestaoColaboradoresDirecao)
3. **Header**: Adicionar botão "Nova Função" (roxo) ao lado do "Nova Vaga" existente, envolvendo ambos em um `div` com `flex gap-2`
4. **Botão editar por grupo de role**: No título de cada role group (linha 266), adicionar ícone de lápis que abre `EditRoleModal` com os dados da role do `systemRoles`
5. **Modais**: Renderizar `CreateRoleModal` e `EditRoleModal` no final do componente

Replica exatamente o padrão já implementado em `GestaoColaboradoresDirecao.tsx`.

