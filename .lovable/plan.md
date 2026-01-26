

## Plano: Corrigir Ordens de Pintura Faltantes

### Problema Identificado

Existem **9 pedidos** na etapa "Aguardando Pintura" que possuem pintura contratada e itens que requerem pintura, mas **não tiveram a ordem de pintura criada**.

A causa é um **bug na função SQL** `criar_ordem_pintura` que referencia a coluna `lo.item_estoque_id` que não existe - a coluna correta é `lo.estoque_id`.

---

### Parte 1: Corrigir a Funcao SQL

Atualizar a funcao `criar_ordem_pintura` para usar o nome correto da coluna:

```sql
-- ANTES (linha com bug):
LEFT JOIN estoque e ON e.id = lo.item_estoque_id

-- DEPOIS (corrigido):
LEFT JOIN estoque e ON e.id = lo.estoque_id
```

---

### Parte 2: Criar Ordens para Pedidos Afetados

Executar a funcao corrigida para os 9 pedidos que estao sem ordem de pintura:

| Pedido | ID | Cliente |
|--------|----|---------|
| 0089 | 2c3d2dde-e04c-4c6c-9621-2ab719b8fdf2 | Finamore Comercio... |
| 0099 | e99f0197-5e99-45a9-b5f8-da752e369d38 | FERNANDO FIGUEIRO LTDA |
| 0105 | 187d12ad-dab5-46de-94a0-b3f7a97359a1 | Moacir Thurow |
| 0107 | 00170153-d35b-4c61-944f-2a2bf93f1fd2 | Elaine Maria Guzzo |
| 0108 | 6315de4a-d270-40c9-96c4-01193192676b | Jorge Adalberto Martins |
| 0118 | 329c5787-da9e-4a81-9d1d-3f7699081330 | Edimar Pereira da Rosa |
| 0119 | b157f1fe-bbfc-4c18-86fa-f687bf2ef5b8 | Silmar Dewes |
| 0136 | 46af161c-f213-4741-97c2-31a20b568d79 | Mariza Salete Polidoro |
| 0137 | 0c09bf94-1bc2-441c-90a4-0bc540f03db0 | Roberto Cardoso |

---

### SQL da Migracao

```sql
-- 1. Corrigir a funcao criar_ordem_pintura
CREATE OR REPLACE FUNCTION public.criar_ordem_pintura(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero_ordem text;
  v_ordem_id uuid;
  v_linha record;
  v_linhas_count integer := 0;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
  v_venda_id uuid;
BEGIN
  RAISE LOG '[criar_ordem_pintura] Iniciando para pedido: %', p_pedido_id;
  
  SELECT venda_id INTO v_venda_id
  FROM pedidos_producao
  WHERE id = p_pedido_id;
  
  IF NOT EXISTS (
    SELECT 1 FROM produtos_vendas 
    WHERE venda_id = v_venda_id 
    AND (valor_pintura > 0 OR tipo_produto = 'pintura_epoxi')
  ) THEN
    RAISE LOG '[criar_ordem_pintura] Venda % nao tem pintura contratada, abortando', v_venda_id;
    RETURN;
  END IF;
  
  IF EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
    RAISE LOG '[criar_ordem_pintura] Ordem de pintura ja existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;

  SELECT em_backlog, prioridade_etapa INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  SELECT 'PINT-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 6) AS INTEGER)), 0) + 1)::text, 5, '0')
  INTO v_numero_ordem
  FROM ordens_pintura;

  INSERT INTO ordens_pintura (pedido_id, numero_ordem, status, em_backlog, prioridade)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente', v_pedido_em_backlog, v_pedido_prioridade)
  RETURNING id INTO v_ordem_id;

  RAISE LOG '[criar_ordem_pintura] Ordem criada: % com id: %', v_numero_ordem, v_ordem_id;

  -- CORRECAO: Usar estoque_id em vez de item_estoque_id
  FOR v_linha IN
    SELECT 
      lo.id as linha_id,
      lo.estoque_id,
      lo.quantidade,
      e.nome_produto,
      e.requer_pintura
    FROM linhas_ordens lo
    JOIN estoque e ON e.id = lo.estoque_id
    WHERE lo.pedido_id = p_pedido_id
    AND lo.tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')
    AND e.categoria = 'componente'
    AND e.requer_pintura = true
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      estoque_id,
      quantidade,
      concluida
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'pintura',
      v_linha.estoque_id,
      v_linha.quantidade,
      false
    );
    v_linhas_count := v_linhas_count + 1;
    RAISE LOG '[criar_ordem_pintura] Linha adicionada: % (requer_pintura: %)', v_linha.nome_produto, v_linha.requer_pintura;
  END LOOP;

  RAISE LOG '[criar_ordem_pintura] Total de linhas criadas: %', v_linhas_count;

  IF v_linhas_count = 0 THEN
    DELETE FROM ordens_pintura WHERE id = v_ordem_id;
    RAISE LOG '[criar_ordem_pintura] Ordem deletada por nao ter linhas';
  END IF;
END;
$$;

-- 2. Criar ordens para os pedidos afetados
SELECT criar_ordem_pintura('2c3d2dde-e04c-4c6c-9621-2ab719b8fdf2'); -- 0089
SELECT criar_ordem_pintura('e99f0197-5e99-45a9-b5f8-da752e369d38'); -- 0099
SELECT criar_ordem_pintura('187d12ad-dab5-46de-94a0-b3f7a97359a1'); -- 0105
SELECT criar_ordem_pintura('00170153-d35b-4c61-944f-2a2bf93f1fd2'); -- 0107
SELECT criar_ordem_pintura('6315de4a-d270-40c9-96c4-01193192676b'); -- 0108
SELECT criar_ordem_pintura('329c5787-da9e-4a81-9d1d-3f7699081330'); -- 0118
SELECT criar_ordem_pintura('b157f1fe-bbfc-4c18-86fa-f687bf2ef5b8'); -- 0119
SELECT criar_ordem_pintura('46af161c-f213-4741-97c2-31a20b568d79'); -- 0136
SELECT criar_ordem_pintura('0c09bf94-1bc2-441c-90a4-0bc540f03db0'); -- 0137
```

---

### Resultado Esperado

Apos a execucao:

1. A funcao `criar_ordem_pintura` estara corrigida para futuros pedidos
2. Os 9 pedidos terao suas ordens de pintura criadas
3. Em `/direcao/gestao-fabrica`, todos os pedidos em "Aguardando Pintura" exibirao suas ordens corretamente
4. O setor de pintura podera visualizar e gerenciar as ordens em `/fabrica/producao/pintura`

