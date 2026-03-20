

## Plano: Adicionar responsável à missão e prazo individual por item

### Mudanças necessárias

**1. Banco de dados (migration)**
- Adicionar coluna `responsavel_id` (uuid, nullable, ref admin_users.user_id) na tabela `missoes`
- Adicionar coluna `prazo` (date, nullable) na tabela `missao_checkboxes`
- Remover coluna `prazo` da tabela `missoes` (o prazo agora é por item)

**2. Hook `useMissoes.ts`**
- Atualizar interface `Missao` para incluir `responsavel_id` e remover `prazo`
- Atualizar interface `MissaoCheckbox` para incluir `prazo`
- Atualizar `criarMissao` para enviar `responsavel_id` na missão e `prazo` em cada checkbox
- Atualizar query para buscar dados do responsável (join com admin_users)

**3. Modal `NovaMissaoModal.tsx`**
- Adicionar Select de responsável (usando `useAllUsers` existente)
- Remover date picker global da missão
- Adicionar um date picker por item de checkbox (inline, compacto)
- Atualizar state: cada item agora é `{ descricao: string, prazo?: Date }` em vez de `string`
- Atualizar `onSubmit` para enviar `responsavel_id` e prazo por item

**4. Página `ChecklistLideranca.tsx`**
- Atualizar a seção de cards das missões: remover referência ao `missao.prazo`
- Exibir o prazo de cada checkbox nos primeiros 5 itens
- Prazo vencido: calcular com base no maior prazo dos checkboxes não concluídos
- Exibir nome do responsável no card

### Arquivos impactados
- **Novo**: migration SQL (alter tables)
- **Editar**: `src/hooks/useMissoes.ts`
- **Editar**: `src/components/todo/NovaMissaoModal.tsx`
- **Editar**: `src/pages/ChecklistLideranca.tsx`

