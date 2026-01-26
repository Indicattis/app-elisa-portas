

## Plano: Corrigir Linhas de Ordens Vazias para Pedido 0092

### Problema Identificado

O pedido **0092** (`60840c18-9164-493c-94db-a2970c4e6985`) possui 3 ordens de producao (soldagem, perfiladeira, separacao) que foram criadas **sem linhas** para executar.

**Causa Raiz:**
A funcao `criar_ordens_producao_automaticas` verifica se ja existe uma linha em `linhas_ordens` com o mesmo `pedido_linha_id`:

```sql
AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo WHERE lo.pedido_linha_id = pl.id)
```

Como ja existiam linhas de **pintura** vinculadas aos mesmos `pedido_linha_id`, a funcao ignorou a criacao de linhas para soldagem/perfiladeira/separacao.

**Evidencia:**
- Linhas de solda (Eixo, Soleira, Guia): `linhas_ordens_count = 1` (da pintura)
- Linhas de perfiladeira (Meia cana): `linhas_ordens_count = 1` (da pintura)
- Linhas de separacao (Motor, Central, etc.): maioria com `linhas_ordens_count = 0`

---

### Parte 1: Corrigir a Funcao SQL

Atualizar a funcao `criar_ordens_producao_automaticas` para verificar `(pedido_linha_id, tipo_ordem)` em vez de apenas `pedido_linha_id`:

```text
-- ANTES (bug):
AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo WHERE lo.pedido_linha_id = pl.id)

-- DEPOIS (corrigido):
AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'soldagem')
```

Mesma correcao para `perfiladeira` e `separacao`.

---

### Parte 2: Criar Linhas para o Pedido Afetado

Inserir manualmente as linhas nas ordens vazias:

| Ordem | ID | Linhas a Criar |
|-------|-----|----------------|
| Soldagem | 2ceea7e4-e9d8-4c50-9206-aa7a96b46e58 | 6 itens (Eixo, Soleira, Guia) |
| Perfiladeira | bf95cffc-7f0a-4c2e-a2a8-3b3c41383531 | 2 itens (Meia cana lisa) |
| Separacao | a79b1427-826a-4f41-9821-438a1e97de55 | 15+ itens (Motor, Central, Orelhas, etc.) |

---

### Resumo Tecnico da Migracao

```sql
-- 1. Corrigir a funcao para verificar (pedido_linha_id, tipo_ordem)
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(...)
-- Alterar todas as clausulas NOT EXISTS para incluir tipo_ordem

-- 2. Inserir linhas para soldagem
INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, ...)
SELECT '2ceea7e4-...', pl.pedido_id, 'soldagem', ...
FROM pedido_linhas pl
WHERE pl.pedido_id = '60840c18-...' AND pl.categoria_linha = 'solda'
  AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo 
                  WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'soldagem');

-- 3. Inserir linhas para perfiladeira
INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, ...)
SELECT 'bf95cffc-...', pl.pedido_id, 'perfiladeira', ...
FROM pedido_linhas pl
WHERE pl.pedido_id = '60840c18-...' AND pl.categoria_linha = 'perfiladeira'
  AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo 
                  WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'perfiladeira');

-- 4. Inserir linhas para separacao
INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, ...)
SELECT 'a79b1427-...', pl.pedido_id, 'separacao', ...
FROM pedido_linhas pl
WHERE pl.pedido_id = '60840c18-...' AND pl.categoria_linha = 'separacao'
  AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo 
                  WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'separacao');
```

---

### Resultado Esperado

1. A funcao `criar_ordens_producao_automaticas` permitira que um mesmo item do pedido tenha linhas em multiplos setores (ex: solda + pintura)
2. O pedido 0092 tera todas as linhas criadas nas 3 ordens de producao
3. Os operadores poderao marcar os itens como concluidos em cada setor
4. O fluxo de producao nao sera bloqueado por ordens vazias

