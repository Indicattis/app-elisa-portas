
# Plano: Corrigir Interface das Rotas do Estoque em /admin/permissions

## Problema Identificado

As rotas do Estoque (`estoque_hub`, `estoque_fabrica`, `estoque_almoxarifado`, `estoque_fornecedores`) estão cadastradas na tabela `app_routes` com `interface: 'dashboard'`, mas o componente de permissões só exibe rotas com interfaces: `padrao`, `producao`, `paineis` ou `admin`.

## Solução

Criar uma migration para atualizar o campo `interface` de todas as rotas do Estoque de `'dashboard'` para `'padrao'`.

---

## Alteração Necessária

### Nova Migration SQL

```sql
-- Atualizar interface das rotas de Estoque para aparecerem em /admin/permissions
UPDATE app_routes 
SET interface = 'padrao'
WHERE key IN ('estoque_hub', 'estoque_fabrica', 'estoque_almoxarifado', 'estoque_fornecedores');
```

---

## Resultado Esperado

Após a migration, em `/admin/permissions`:

1. Selecione a interface **"Padrão"**
2. O **Estoque** aparecerá como um Hub Principal (estilo dourado/amber)
3. Com 3 sub-rotas:
   - Fábrica (`/estoque/fabrica`)
   - Almoxarifado (`/estoque/almoxarifado`)
   - Fornecedores (`/estoque/fornecedores`)

```text
┌────────────────────────────────────────────────────┐
│ Interface: [Padrão ▼]                              │
├────────────────────────────────────────────────────┤
│ ▼ 🟡 Estoque          Hub Principal   (3 sub-rotas)│
│     ☐ Fábrica         /estoque/fabrica            │
│     ☐ Almoxarifado    /estoque/almoxarifado       │
│     ☐ Fornecedores    /estoque/fornecedores       │
└────────────────────────────────────────────────────┘
```

---

## Resumo

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/[timestamp].sql` | Criar migration UPDATE |

Essa é uma correção simples de dados que não requer alterações em código React.
