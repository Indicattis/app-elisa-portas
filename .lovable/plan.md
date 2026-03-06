

# Salvar Venda como Rascunho + Seção de Rascunhos em Minhas Vendas

## 1. Migration: Adicionar coluna `is_rascunho` na tabela `vendas`

```sql
ALTER TABLE vendas ADD COLUMN is_rascunho boolean NOT NULL DEFAULT false;
```

## 2. `src/hooks/useVendas.ts` — Criar mutation `createRascunho`

- Reutilizar a lógica de `createVendaMutation` mas com validações relaxadas (não exigir todos os campos obrigatórios como CEP, bairro, endereço, comprovante).
- Inserir a venda com `is_rascunho: true`.
- Produtos são salvos normalmente em `produtos_vendas`.
- Pagamento pode ser salvo parcialmente ou ignorado.

## 3. `src/pages/vendas/VendaNovaMinimalista.tsx` — Botão "Salvar Rascunho"

- Adicionar botão "Salvar Rascunho" ao lado de "Criar Venda" (linha ~1016).
- O botão chama uma função `handleSalvarRascunho` que:
  - Não exige validações obrigatórias (localização, produtos, etc.)
  - Salva o que foi preenchido até o momento com `is_rascunho: true`
  - Navega para `/vendas/minhas-vendas` após salvar

## 4. `src/pages/vendas/MinhasVendas.tsx` — Seção de Rascunhos em Carrossel

- Adicionar query separada para buscar rascunhos: `vendas` onde `is_rascunho = true` e `atendente_id = user.id`.
- A query principal existente recebe filtro `.eq('is_rascunho', false)` para não misturar.
- Exibir seção "Rascunhos" acima da tabela, usando o componente `Carousel` existente.
- Cada card do carrossel mostra: nome do cliente, cidade, valor parcial, data de criação, e botão para continuar editando.
- Botão "Continuar" navega para `/vendas/minhas-vendas/editar/:id`.
- Botão de excluir rascunho com confirmação.

## 5. Edição de Rascunho

- Na página de edição (`MinhasVendasEditar`), ao salvar um rascunho como venda final, setar `is_rascunho: false` e aplicar validações normais.

## Arquivos alterados
- Migration SQL (nova coluna)
- `src/hooks/useVendas.ts` — mutation de rascunho
- `src/pages/vendas/VendaNovaMinimalista.tsx` — botão salvar rascunho
- `src/pages/vendas/MinhasVendas.tsx` — query de rascunhos + carrossel

