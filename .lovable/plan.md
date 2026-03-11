

## Diagnóstico: Operações falham silenciosamente por falta de permissão RLS

### Causa raiz
O usuário logado tem role `gerente_marketing`. As políticas RLS da tabela `system_roles` só permitem UPDATE/DELETE para `administrador` e `diretor`. O Supabase não retorna erro quando RLS bloqueia um UPDATE — simplesmente afeta 0 linhas. Por isso o toast de sucesso aparece, mas nada muda no banco.

Isso afeta tanto a exclusão (UPDATE `ativo=false`) quanto o drag-and-drop (UPDATE `ordem`).

### Solução

**1. Atualizar a policy RLS de UPDATE em `system_roles`** para incluir roles com acesso à gestão (ex: adicionar `gerente_marketing` ou, melhor, qualquer role que tenha acesso à rota `/direcao`).

Migration SQL:
```sql
DROP POLICY "Admins e diretores podem atualizar roles" ON public.system_roles;
CREATE POLICY "Gestores podem atualizar roles" ON public.system_roles
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('administrador', 'diretor', 'gerente_marketing', 'gerente_vendas', 'gerente_producao')
      AND admin_users.ativo = true
  ));
```

**2. Adicionar verificação de resultado no código** para detectar quando 0 linhas foram afetadas e mostrar erro adequado ao invés de falso sucesso.

Em `handleDeleteRole` e `handleRoleDragEnd` em `GestaoColaboradoresDirecao.tsx`:
- Adicionar `.select()` ao update e verificar se retornou dados
- Se não retornou, mostrar `toast.error` com mensagem de permissão

### Arquivos
| Arquivo | Mudança |
|---|---|
| Migration SQL | Atualizar policy de UPDATE e DELETE para incluir gerentes |
| `GestaoColaboradoresDirecao.tsx` | Verificar resultado das operações de update |

