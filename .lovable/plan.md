

# Proteger pedidos arquivados contra alteracao de etapa

## Diagnostico

Investiguei o banco de dados e o fluxo de arquivamento. Os dados atuais estao consistentes - todos os pedidos arquivados mantem `etapa_atual = 'finalizado'` e `arquivado = true`. Nenhum pedido atualmente em `instalacoes` foi previamente finalizado ou arquivado.

Porem, existe uma vulnerabilidade real: o trigger `sync_pedido_etapa_atual` que sincroniza a etapa do pedido com base na tabela `pedidos_etapas` **nao verifica se o pedido esta arquivado**. Se qualquer operacao tocar em um registro de `pedidos_etapas` de um pedido arquivado, o trigger pode sobrescrever `etapa_atual` com um valor diferente de `finalizado`.

## Mudancas

### 1. Migracao SQL: Proteger trigger contra pedidos arquivados

Atualizar a funcao `sync_pedido_etapa_atual` para ignorar pedidos arquivados:

```sql
CREATE OR REPLACE FUNCTION sync_pedido_etapa_atual()
RETURNS TRIGGER AS $$
DECLARE
  v_ultima_etapa TEXT;
  v_arquivado BOOLEAN;
BEGIN
  -- Verificar se o pedido esta arquivado
  SELECT arquivado INTO v_arquivado
  FROM pedidos_producao
  WHERE id = NEW.pedido_id;

  -- Se esta arquivado, nao alterar nada
  IF v_arquivado = true THEN
    RETURN NEW;
  END IF;

  -- Buscar a ultima etapa do pedido
  SELECT etapa INTO v_ultima_etapa
  FROM pedidos_etapas
  WHERE pedido_id = NEW.pedido_id
  ORDER BY 
    CASE 
      WHEN data_saida IS NULL THEN data_entrada
      ELSE data_saida
    END DESC
  LIMIT 1;
  
  UPDATE pedidos_producao
  SET 
    etapa_atual = v_ultima_etapa,
    updated_at = now()
  WHERE id = NEW.pedido_id
    AND (etapa_atual IS DISTINCT FROM v_ultima_etapa);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Migracao SQL: Proteger o campo `arquivado` no UPDATE do pedido

Adicionar verificacao no hook `moverParaProximaEtapa` para bloquear avancos de pedidos arquivados. Atualmente o codigo nao verifica `arquivado` antes de tentar mover.

### 3. Arquivo: `src/hooks/usePedidosEtapas.ts`

Na funcao `moverParaProximaEtapa`, adicionar verificacao logo apos buscar o pedido (linha ~516):

```typescript
// Buscar pedido atual
const { data: pedido } = await supabase
  .from('pedidos_producao')
  .select('etapa_atual, arquivado')
  .eq('id', pedidoId)
  .single();

if (pedido.arquivado) {
  throw new Error('Pedido arquivado nao pode ser movido');
}
```

Mesma verificacao na funcao `retrocederEtapa`.

## Resumo

A correcao principal e no trigger SQL (`sync_pedido_etapa_atual`) que passa a ignorar pedidos arquivados, prevenindo que qualquer operacao indireta em `pedidos_etapas` mova um pedido ja arquivado de volta para uma etapa anterior. Adicionalmente, protecoes no frontend impedem tentativas de mover pedidos arquivados.

