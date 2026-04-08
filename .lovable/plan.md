

## Plano: Corrigir permissão para marcar linhas em /fabrica/ordens-pedidos

### Diagnóstico
As políticas RLS da tabela `linhas_ordens` para UPDATE permitem apenas:
1. **O responsável da ordem** (ou ordens sem responsável) — via `pode_marcar_linhas_ordem`
2. **Operadores de fábrica** (setor = 'fabrica') — via `is_factory_operator`

Usuários com papel `administrador` ou `diretor` têm `setor = 'administrativo'`, então nenhuma das duas políticas os autoriza. O checkbox marca visualmente (optimistic update) mas reverte quando o update falha no banco.

### Solução
Criar uma nova política RLS de UPDATE que permita administradores e usuários com `bypass_permissions` atualizarem linhas de ordens.

### Alteração (migração SQL)

```sql
CREATE POLICY "Admins can update linhas_ordens"
ON public.linhas_ordens
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
```

Isso permite que administradores marquem/desmarquem linhas na interface de gestão de fábrica, sem alterar o comportamento para operadores de produção.

### Arquivo alterado
- Nova migração SQL (1 arquivo)

