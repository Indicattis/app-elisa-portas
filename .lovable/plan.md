
# Plano: Remover Filtro de Quantidade no Modal de Seleção

## Problema
Produtos cadastrados no catálogo não aparecem no modal de seleção em `/vendas/minhas-vendas/nova` porque a query filtra por `quantidade > 0`.

---

## Alteração

### Arquivo: `src/components/vendas/SelecionarAcessoriosModal.tsx`

**Remover linha 45:**
```typescript
// REMOVER ESTA LINHA:
.gt('quantidade', 0)
```

**Query atual (linhas 41-47):**
```typescript
const { data, error } = await supabase
  .from('vendas_catalogo')
  .select('*')
  .eq('ativo', true)
  .gt('quantidade', 0)  // ← REMOVER
  .order('destaque', { ascending: false })
  .order('nome_produto');
```

**Query corrigida:**
```typescript
const { data, error } = await supabase
  .from('vendas_catalogo')
  .select('*')
  .eq('ativo', true)
  .order('destaque', { ascending: false })
  .order('nome_produto');
```

---

## Resultado Esperado

Todos os produtos ativos do catálogo aparecerão no modal de seleção, independentemente da quantidade em estoque.

---

## Arquivo Afetado

| Arquivo | Ação |
|---------|------|
| `src/components/vendas/SelecionarAcessoriosModal.tsx` | Remover filtro `.gt('quantidade', 0)` |
