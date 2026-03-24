

## Plano: Adicionar botão "Leads" no hub de Vendas

### Alteração

**`src/pages/vendas/VendasHub.tsx`**

Adicionar um novo item ao array `menuItems`:

```ts
{ label: 'Leads', icon: UserPlus, path: '/vendas/leads' }
```

- Importar `UserPlus` de `lucide-react`
- O botão aparecerá no mobile (lista) e desktop (grid) automaticamente

### Rota

Será necessário criar a rota `/vendas/leads` no router. Ela apontará para uma nova página que lista os leads da tabela `elisaportas_leads`.

### Nova página `src/pages/vendas/LeadsList.tsx`

- Buscar leads de `elisaportas_leads` filtrados pelo usuário logado (se houver campo `atendente_id` ou similar)
- Exibir lista com nome, telefone, cidade, status
- Botão voltar para `/vendas`
- Estilo consistente com as outras páginas de vendas (fundo escuro, cards com glassmorphism)

### Arquivos alterados
1. `src/pages/vendas/VendasHub.tsx` — novo item no menu
2. `src/pages/vendas/LeadsList.tsx` — nova página (criar)
3. `src/App.tsx` — nova rota `/vendas/leads`

