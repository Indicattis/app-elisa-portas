

## Diagnóstico: Item "Guia G - 180mm / Testeira 45" ausente na ordem de pintura

### Causa raiz

A função `criar_ordem_pintura` filtra itens com `e.categoria = 'componente'`. Porém, o item de estoque usado neste pedido (id `fb922ebf-...`) tem `categoria = 'a6eea8c9-35a0-4181-acdf-2cad1c71653c'` (um UUID em vez da string `'componente'`).

Existem **duas entradas duplicadas** do mesmo produto no estoque:
- `c24ae9be-...` → categoria `'componente'` ✅
- `fb922ebf-...` → categoria `'a6eea8c9-...'` (UUID) ❌ ← este foi usado no pedido

Como a função filtra por `categoria = 'componente'`, o item é excluído da ordem de pintura.

### Solução

Duas ações:

**1. Corrigir a função `criar_ordem_pintura`** — remover o filtro `e.categoria = 'componente'`, pois `requer_pintura = true` já é suficiente para determinar quais itens devem ir para pintura. Há 66 itens com `requer_pintura = true`, sendo 13 deles com categorias diferentes de `'componente'`.

**2. Corrigir a ordem PINT-00141** — inserir manualmente a linha faltante na `linhas_ordens` para que o item apareça na ordem existente.

### Mudanças

**Migration SQL:**
```sql
-- Remover filtro restritivo de categoria na função
-- Linha atual: AND e.categoria = 'componente'
-- Substituir por: (remover essa linha, manter apenas requer_pintura = true)
```

**Insert SQL (dados):**
```sql
-- Inserir a linha faltante na ordem PINT-00141
INSERT INTO linhas_ordens (pedido_id, ordem_id, tipo_ordem, estoque_id, quantidade, concluida, item, produto_venda_id, indice_porta)
VALUES ('116c8036-e4c8-4658-b7e2-a320329b7418', '6afac3a4-7afc-4eb0-b956-5e7707b40a2b', 'pintura', 'fb922ebf-47b8-49c1-aeda-fa244aab9819', 2, false, 'Guia G - 180mm / Testeira 45', 'd718e068-afc4-4674-b853-c78755f5a27f', 0);
```

Nenhum arquivo de código precisa ser alterado — a correção é inteiramente no banco.

