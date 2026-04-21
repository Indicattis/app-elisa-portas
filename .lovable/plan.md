

## Permitir que Diretor edite "Regras de Vendas"

### Causa

A página `/direcao/vendas/regras-vendas` salva em `public.configuracoes_vendas`. A política RLS de UPDATE atual só aceita usuários com role `admin` / `administrador` ou `bypass_permissions = true`:

```
EXISTS (SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
          AND (role IN ('admin','administrador') OR bypass_permissions = true)
          AND ativo = true)
```

Como a rota está em `/direcao/*`, Diretores também precisam editar — hoje recebem o toast “Você não tem permissão…”.

### Mudança

Migração SQL atualizando as políticas de UPDATE e INSERT em `public.configuracoes_vendas` para incluir o role `diretor`:

```sql
DROP POLICY "Administradores podem atualizar configurações" ON public.configuracoes_vendas;
DROP POLICY "Administradores podem inserir configurações" ON public.configuracoes_vendas;

CREATE POLICY "Admins e diretores podem atualizar configurações"
ON public.configuracoes_vendas FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE user_id = auth.uid() AND ativo = true
    AND (role IN ('admin','administrador','diretor') OR bypass_permissions = true)
));

CREATE POLICY "Admins e diretores podem inserir configurações"
ON public.configuracoes_vendas FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE user_id = auth.uid() AND ativo = true
    AND (role IN ('admin','administrador','diretor') OR bypass_permissions = true)
));
```

A política de SELECT (qualquer autenticado pode ler) permanece inalterada.

### Fora de escopo

- Não altera UI nem hook `useConfiguracoesVendas`.
- Não concede acesso a outros roles (ex.: gerente_comercial). Se desejado, posso incluir depois.

### Arquivos

- nova migração SQL em `supabase/migrations/`.

