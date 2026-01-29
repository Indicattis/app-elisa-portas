
# Plano: Corrigir Criacao Condicional de Ordens de Qualidade

## Problema Identificado

A ordem de qualidade **OQU-2026-0082** foi criada para o pedido **#0152** (Daiane Raquel Rosa Camargo), mas este pedido possui **apenas itens de separacao**:

| Item | Categoria | Quantidade |
|------|-----------|------------|
| Controle Avulso | separacao | 2 |

A funcao SQL `criar_ordem_qualidade` cria a ordem de qualidade **antes** de verificar se existem itens elegiveis (solda/perfiladeira), resultando em ordens vazias que nao deveriam existir.

---

## Analise da Logica Atual

```sql
-- Funcao ATUAL: criar_ordem_qualidade
1. Verifica se ja existe ordem de qualidade
2. Gera numero da ordem
3. CRIA a ordem de qualidade (INSERT)  <-- Problema: cria sem verificar itens
4. Depois, adiciona linhas apenas de solda/perfiladeira
```

O resultado: ordens de qualidade vazias quando o pedido tem apenas itens de separacao.

---

## Solucao

### 1. Corrigir Funcao SQL `criar_ordem_qualidade`

Adicionar verificacao **antes** de criar a ordem para garantir que existem itens elegiveis:

```sql
CREATE OR REPLACE FUNCTION public.criar_ordem_qualidade(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_ordem_id uuid;
  v_numero_ordem text;
  v_linha record;
  v_linhas_elegiveis INTEGER;
BEGIN
  -- Verificar se ja existe ordem de qualidade para este pedido
  SELECT id INTO v_ordem_id 
  FROM ordens_qualidade 
  WHERE pedido_id = p_pedido_id AND historico = false;
  
  IF v_ordem_id IS NOT NULL THEN
    RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade ja existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- NOVA VERIFICACAO: Contar itens elegiveis (solda/perfiladeira)
  SELECT COUNT(*) INTO v_linhas_elegiveis
  FROM pedido_linhas 
  WHERE pedido_id = p_pedido_id 
    AND categoria_linha IN ('solda', 'perfiladeira');
  
  -- Se nao ha itens elegiveis, nao criar a ordem
  IF v_linhas_elegiveis = 0 THEN
    RAISE LOG '[criar_ordem_qualidade] Nenhum item elegivel (solda/perfiladeira) para pedido: %. Ordem NAO sera criada.', p_pedido_id;
    RETURN;
  END IF;
  
  -- Gerar numero da ordem
  SELECT gerar_numero_ordem('qualidade') INTO v_numero_ordem;
  
  -- Criar ordem de qualidade
  INSERT INTO ordens_qualidade (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade criada: % com numero: %', v_ordem_id, v_numero_ordem;
  
  -- Criar linhas APENAS para itens de SOLDA e PERFILADEIRA
  FOR v_linha IN 
    SELECT * FROM pedido_linhas 
    WHERE pedido_id = p_pedido_id 
      AND categoria_linha IN ('solda', 'perfiladeira')
    ORDER BY ordem
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      estoque_id
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'qualidade',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
      false,
      v_linha.estoque_id
    );
  END LOOP;
  
END;
$function$;
```

### 2. Limpar Ordem Invalida Existente

Deletar a ordem de qualidade vazia que foi criada incorretamente:

```sql
-- Deletar linhas associadas (se houver)
DELETE FROM linhas_ordens 
WHERE ordem_id = '3f105cb6-b976-464b-b638-80fafb3c70db' 
  AND tipo_ordem = 'qualidade';

-- Deletar a ordem de qualidade vazia
DELETE FROM ordens_qualidade 
WHERE id = '3f105cb6-b976-464b-b638-80fafb3c70db';
```

### 3. Ajustar Fluxo de Avanco (Opcional)

O frontend em `usePedidosEtapas.ts` pode pular a etapa de inspecao de qualidade quando nao ha itens elegiveis. Porem, isso ja esta coberto pela funcao SQL que simplesmente retorna sem criar a ordem.

---

## Resumo das Alteracoes

| Arquivo/Recurso | Acao |
|-----------------|------|
| Funcao SQL `criar_ordem_qualidade` | Adicionar verificacao de itens elegiveis antes de criar ordem |
| Ordem `OQU-2026-0082` | Deletar ordem vazia do banco de dados |

---

## Impacto

- **Pedidos so com separacao**: Nao terao ordem de qualidade criada
- **Pedidos com solda/perfiladeira**: Continuarao tendo ordem de qualidade normalmente
- **Pedidos mistos**: Ordem de qualidade tera apenas itens de solda/perfiladeira

---

## Consideracao sobre o Fluxo do Pedido #0152

Apos deletar a ordem de qualidade, o pedido pode precisar de ajuste manual na etapa. Se ele esta em `inspecao_qualidade` sem ordem de qualidade valida, pode ser necessario:

1. Avancar manualmente para a proxima etapa (`aguardando_pintura` ou `aguardando_coleta`)
2. Ou ajustar o status via SQL

Vou verificar a etapa atual do pedido se necessario durante a implementacao.
