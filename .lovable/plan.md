
## Plano: Remover Paginação e Corrigir Ordens Faltantes

### Visao Geral

O usuario identificou dois problemas na pagina `/direcao/gestao-fabrica`:

1. **Ordens faltantes**: Os 3 ultimos pedidos na etapa "Em Producao" (0087, 0092, 0093) nao possuem ordens de producao, apesar de terem linhas de producao cadastradas
2. **Paginacao**: Solicita remocao da paginacao para exibir todos os pedidos de uma vez

---

### Parte 1: Remover Paginacao

A paginacao sera removida da pagina GestaoFabricaDirecao. Todos os pedidos da etapa serao exibidos sem limite.

#### Alteracoes no Arquivo

**Arquivo:** `src/pages/direcao/GestaoFabricaDirecao.tsx`

| Linha | Alteracao |
|-------|-----------|
| 49 | Remover estado `paginaAtual` |
| 53 | Remover constante `ITENS_POR_PAGINA` |
| 164-166 | Remover `useEffect` que reseta paginacao |
| 168-171 | Remover calculo de paginacao (`totalPaginas`, `indiceInicio`, etc.) |
| 348 | Remover texto de paginacao no header |
| 470 | Alterar de `pedidosPaginados` para `pedidosFiltrados` |
| 484-536 | Remover bloco completo da UI de paginacao |

---

### Parte 2: Criar Ordens para Pedidos Antigos

Os pedidos que entraram na etapa "em_producao" antes da implementacao do sistema de criacao automatica nao possuem ordens. Uma migration SQL criara as ordens faltantes.

#### Pedidos Afetados

| Pedido | Cliente | Linhas Solda | Linhas Perfiladeira | Linhas Separacao |
|--------|---------|--------------|---------------------|------------------|
| 0087 | Finamore Comercio... | 3 | 1 | 10 |
| 0092 | Valderi Lopes | 6 | 2 | 19 |
| 0093 | TREINAMENTO E ASSESSORIA... | 3 | 2 | 10 |

#### SQL para Criar Ordens

```sql
-- Inserir ordens de soldagem para pedidos que tem linhas de solda mas nao tem ordens
INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status)
SELECT DISTINCT 
  pl.pedido_id,
  'SOL-' || SUBSTRING(pl.pedido_id::text, 1, 8),
  'pendente'
FROM pedido_linhas pl
WHERE pl.categoria_linha = 'solda'
  AND pl.pedido_id IN (
    '0d4acc35-162e-44cf-b2f5-19fa3fc66755',
    '60840c18-9164-493c-94db-a2970c4e6985',
    '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ordens_soldagem os WHERE os.pedido_id = pl.pedido_id
  );

-- Inserir ordens de perfiladeira
INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
SELECT DISTINCT 
  pl.pedido_id,
  'PERF-' || SUBSTRING(pl.pedido_id::text, 1, 8),
  'pendente'
FROM pedido_linhas pl
WHERE pl.categoria_linha = 'perfiladeira'
  AND pl.pedido_id IN (
    '0d4acc35-162e-44cf-b2f5-19fa3fc66755',
    '60840c18-9164-493c-94db-a2970c4e6985',
    '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ordens_perfiladeira op WHERE op.pedido_id = pl.pedido_id
  );

-- Inserir ordens de separacao
INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
SELECT DISTINCT 
  pl.pedido_id,
  'SEP-' || SUBSTRING(pl.pedido_id::text, 1, 8),
  'pendente'
FROM pedido_linhas pl
WHERE pl.categoria_linha = 'separacao'
  AND pl.pedido_id IN (
    '0d4acc35-162e-44cf-b2f5-19fa3fc66755',
    '60840c18-9164-493c-94db-a2970c4e6985',
    '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ordens_separacao ose WHERE ose.pedido_id = pl.pedido_id
  );
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/direcao/GestaoFabricaDirecao.tsx` | Remover toda logica e UI de paginacao |
| Nova migration SQL | Criar ordens faltantes para os 3 pedidos |

---

### Resultado Esperado

Apos a implementacao:

1. Todos os pedidos de cada etapa serao exibidos sem paginacao
2. Os 3 pedidos antigos (0087, 0092, 0093) terao suas ordens de producao criadas
3. A interface permitira arrastar e reordenar todos os pedidos sem limitacao de pagina
