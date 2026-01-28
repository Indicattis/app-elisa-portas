
## Plano: Implementar Regeneração de Linhas para Qualidade e Pintura

### Contexto

O usuário definiu critérios específicos para regeneração de linhas:

| Tipo de Ordem | Critério de Linhas |
|---------------|-------------------|
| **Qualidade** | Todas as linhas do pedido **EXCETO** linhas de separação |
| **Pintura** | Linhas que **requerem pintura** (estoque.requer_pintura = true) |

### Análise Técnica

#### Estrutura Atual da Função SQL `regenerar_linhas_ordem`

```sql
CASE p_tipo_ordem
  WHEN 'soldagem' THEN ...
  WHEN 'perfiladeira' THEN ...
  WHEN 'separacao' THEN ...
  ELSE RETURN 'Tipo de ordem inválido'
END CASE;
```

A função atual filtra por `categoria_linha` ou `setor_responsavel_producao`, o que funciona para ordens de produção, mas não atende aos novos critérios.

#### Critérios de Seleção das Linhas

**Para Qualidade:**
```sql
-- Todas as linhas EXCETO separação
WHERE pl.pedido_id = v_pedido_id
  AND pl.categoria_linha != 'separacao'
```

**Para Pintura:**
```sql
-- Linhas que requerem pintura (via estoque)
WHERE pl.pedido_id = v_pedido_id
  AND e.requer_pintura = true
```

Nota: A função `criar_ordem_pintura` já usa este critério, então manteremos consistência.

### Alterações Necessárias

#### 1. Atualizar Função SQL `regenerar_linhas_ordem`

Adicionar suporte para `qualidade` e `pintura` no CASE statement:

```sql
CREATE OR REPLACE FUNCTION public.regenerar_linhas_ordem(
  p_ordem_id UUID,
  p_tipo_ordem TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id UUID;
  v_status TEXT;
  v_linha RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Buscar pedido_id e status da ordem
  CASE p_tipo_ordem
    WHEN 'soldagem' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_soldagem WHERE id = p_ordem_id;
    WHEN 'perfiladeira' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_perfiladeira WHERE id = p_ordem_id;
    WHEN 'separacao' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_separacao WHERE id = p_ordem_id;
    WHEN 'qualidade' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_qualidade WHERE id = p_ordem_id;
    WHEN 'pintura' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_pintura WHERE id = p_ordem_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Tipo de ordem inválido');
  END CASE;

  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ordem não encontrada');
  END IF;

  IF v_status = 'concluido' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Não é possível regenerar linhas de uma ordem concluída'
    );
  END IF;

  -- Excluir linhas atuais
  DELETE FROM linhas_ordens 
  WHERE ordem_id = p_ordem_id AND tipo_ordem = p_tipo_ordem;

  -- SOLDAGEM, PERFILADEIRA, SEPARACAO: lógica existente (categoria_linha/setor)
  IF p_tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao') THEN
    FOR v_linha IN
      SELECT ... -- lógica atual mantida
      WHERE pl.pedido_id = v_pedido_id
        AND COALESCE(e.setor_responsavel_producao::text, ...) = p_tipo_ordem
    LOOP
      -- INSERT linhas_ordens
    END LOOP;

  -- QUALIDADE: todas exceto separação
  ELSIF p_tipo_ordem = 'qualidade' THEN
    FOR v_linha IN
      SELECT 
        pl.id as pedido_linha_id,
        pl.quantidade,
        pl.estoque_id,
        COALESCE(e.nome_produto, pl.nome_produto) as nome_produto_final,
        pv.tamanho,
        pv.largura,
        pv.altura,
        pv.tipo_pintura,
        cc.nome as cor_nome,
        pl.produto_venda_id
      FROM pedido_linhas pl
      LEFT JOIN estoque e ON pl.estoque_id = e.id
      LEFT JOIN produtos_vendas pv ON pl.produto_venda_id = pv.id
      LEFT JOIN catalogo_cores cc ON pv.cor_id = cc.id
      WHERE pl.pedido_id = v_pedido_id
        AND pl.categoria_linha != 'separacao'  -- EXCETO separação
    LOOP
      INSERT INTO linhas_ordens (...) VALUES (...);
      v_count := v_count + 1;
    END LOOP;

  -- PINTURA: linhas que requerem pintura
  ELSIF p_tipo_ordem = 'pintura' THEN
    FOR v_linha IN
      SELECT 
        pl.id as pedido_linha_id,
        pl.quantidade,
        pl.estoque_id,
        e.nome_produto as nome_produto_final,
        pv.tamanho,
        pv.largura,
        pv.altura,
        pv.tipo_pintura,
        cc.nome as cor_nome,
        pl.produto_venda_id
      FROM pedido_linhas pl
      JOIN estoque e ON pl.estoque_id = e.id  -- INNER JOIN: precisa ter estoque
      LEFT JOIN produtos_vendas pv ON pl.produto_venda_id = pv.id
      LEFT JOIN catalogo_cores cc ON pv.cor_id = cc.id
      WHERE pl.pedido_id = v_pedido_id
        AND e.requer_pintura = true  -- Apenas itens que requerem pintura
    LOOP
      INSERT INTO linhas_ordens (...) VALUES (...);
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'linhas_criadas', v_count);
END;
$$;
```

#### 2. Atualizar Frontend para Exibir Botão

Modificar a constante `TIPOS_COM_REGENERACAO` para incluir todos os tipos:

```typescript
// Antes
const TIPOS_COM_REGENERACAO: TipoOrdem[] = ['soldagem', 'perfiladeira', 'separacao'];

// Depois
const TIPOS_COM_REGENERACAO: TipoOrdem[] = ['soldagem', 'perfiladeira', 'separacao', 'qualidade', 'pintura'];
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Nova migração SQL** | Atualizar função `regenerar_linhas_ordem` com suporte a `qualidade` e `pintura` |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Adicionar `qualidade` e `pintura` à lista `TIPOS_COM_REGENERACAO` |

### Resultado Esperado

- Botão "Regenerar linhas" visível para **todos os tipos** de ordem
- **Qualidade**: Regenera com todas as linhas do pedido exceto as de separação
- **Pintura**: Regenera apenas com linhas que possuem `estoque.requer_pintura = true`
- Comportamento existente para soldagem/perfiladeira/separação permanece inalterado
