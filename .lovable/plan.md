
## Plano: Corrigir Linhas Faltantes nas Ordens de Producao (Pedido 0093)

### Problema Identificado

O pedido `0093` (ID: `1b05ea5b-844b-418d-a5fa-7c4936d97f8b`) foi retrocedido em 22/01 e depois avancado novamente para producao. Porem, as linhas de producao (`linhas_ordens`) nao foram regeneradas corretamente para as ordens de soldagem, perfiladeira e separacao.

**Dados do banco de dados confirmam:**
- Pedido tem 15 linhas em `pedido_linhas` (3 solda, 2 perfiladeira, 10 separacao)
- Ordens existem: SOL-1b05ea5b, PERF-1b05ea5b, SEP-1b05ea5b
- **0 linhas** em `linhas_ordens` para essas ordens
- Apenas 6 linhas de **pintura** existem (de uma etapa posterior)

**Causa raiz:** O bug foi corrigido em 26/01 (migration `20260126163055`), mas o pedido foi avancado em 22/01, antes da correcao. As linhas nao foram regeneradas.

---

### Solucao

Executar uma migration para inserir as linhas faltantes nas ordens de producao existentes para este pedido especifico, seguindo o mesmo padrao usado na migration anterior.

---

### Acoes

| Acao | Descricao |
|------|-----------|
| Criar migration SQL | Inserir linhas faltantes para soldagem, perfiladeira e separacao |

---

### SQL para Corrigir os Dados

```sql
-- Inserir linhas para SOLDAGEM (ordem c575538b-12e9-4d07-8d80-800db3919f75)
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
  concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
)
SELECT 
  'c575538b-12e9-4d07-8d80-800db3919f75'::uuid,
  pl.pedido_id, 
  'soldagem', 
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1), 
  pl.tamanho, 
  false, 
  pl.produto_venda_id, 
  pl.largura, 
  pl.altura, 
  pl.id, 
  pl.estoque_id
FROM pedido_linhas pl
WHERE pl.pedido_id = '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'::uuid 
  AND pl.categoria_linha = 'solda'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'soldagem'
  );

-- Inserir linhas para PERFILADEIRA (ordem d11a1ee0-9fff-4229-947f-e634e2c1533f)
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
  concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
)
SELECT 
  'd11a1ee0-9fff-4229-947f-e634e2c1533f'::uuid,
  pl.pedido_id, 
  'perfiladeira', 
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1), 
  pl.tamanho, 
  false, 
  pl.produto_venda_id, 
  pl.largura, 
  pl.altura, 
  pl.id, 
  pl.estoque_id
FROM pedido_linhas pl
WHERE pl.pedido_id = '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'::uuid 
  AND pl.categoria_linha = 'perfiladeira'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'perfiladeira'
  );

-- Inserir linhas para SEPARACAO (ordem 5309297d-a58c-4ffa-aa46-3fd64efb47bd)
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
  concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
)
SELECT 
  '5309297d-a58c-4ffa-aa46-3fd64efb47bd'::uuid,
  pl.pedido_id, 
  'separacao', 
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1), 
  pl.tamanho, 
  false, 
  pl.produto_venda_id, 
  pl.largura, 
  pl.altura, 
  pl.id, 
  pl.estoque_id
FROM pedido_linhas pl
WHERE pl.pedido_id = '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'::uuid 
  AND pl.categoria_linha = 'separacao'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'separacao'
  );
```

---

### Mapeamento de IDs

| Ordem | ID | Tipo |
|-------|-----|------|
| SOL-1b05ea5b | c575538b-12e9-4d07-8d80-800db3919f75 | soldagem |
| PERF-1b05ea5b | d11a1ee0-9fff-4229-947f-e634e2c1533f | perfiladeira |
| SEP-1b05ea5b | 5309297d-a58c-4ffa-aa46-3fd64efb47bd | separacao |

---

### Resultado Esperado

Apos a migration:
- Ordem SOL-1b05ea5b tera 3 linhas (Eixo, Soleira, Guia M)
- Ordem PERF-1b05ea5b tera 2 linhas (Meia cana lisa x2)
- Ordem SEP-1b05ea5b tera 10 linhas (Motor, Central, Cuica, etc.)
- Operadores em `/producao/solda` poderao ver e concluir as linhas normalmente
