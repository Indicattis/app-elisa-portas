
## Plano: Corrigir Pedido 0157 e Melhorar Robustez do Auto-Avanco

### Parte 1: Correcao Manual do Pedido 0157

O pedido 0157 (`8c4cd1a9-671b-4b49-be27-458397f9330b`) deve ser avancado manualmente para `inspecao_qualidade` e ter uma ordem de qualidade criada.

**Acoes:**

1. Fechar a etapa atual `em_producao` no `pedidos_etapas`
2. Criar nova etapa `inspecao_qualidade` no `pedidos_etapas`
3. Atualizar `etapa_atual` do pedido para `inspecao_qualidade`
4. Chamar a funcao `criar_ordem_qualidade` para criar a ordem de qualidade

```sql
-- 1. Fechar etapa em_producao
UPDATE pedidos_etapas
SET data_saida = NOW()
WHERE pedido_id = '8c4cd1a9-671b-4b49-be27-458397f9330b'
  AND etapa = 'em_producao'
  AND data_saida IS NULL;

-- 2. Criar etapa inspecao_qualidade
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
VALUES ('8c4cd1a9-671b-4b49-be27-458397f9330b', 'inspecao_qualidade', NOW());

-- 3. Atualizar pedido
UPDATE pedidos_producao
SET etapa_atual = 'inspecao_qualidade',
    updated_at = NOW()
WHERE id = '8c4cd1a9-671b-4b49-be27-458397f9330b';

-- 4. Criar ordem de qualidade
SELECT criar_ordem_qualidade('8c4cd1a9-671b-4b49-be27-458397f9330b');

-- 5. Registrar movimentacao
INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, observacoes)
VALUES (
  '8c4cd1a9-671b-4b49-be27-458397f9330b',
  'em_producao',
  'inspecao_qualidade',
  'Avanco manual via migracao - correcao de auto-avanco que nao funcionou'
);
```

---

### Parte 2: Melhorar Robustez do Auto-Avanco

O problema identificado e uma possivel falha silenciosa no fluxo de auto-avanco. Melhorias propostas:

**2.1. Adicionar Logs Detalhados**

No `usePedidoAutoAvanco.ts`, adicionar logs mais detalhados antes e depois de cada verificacao:

```typescript
// Antes de verificarOrdensProducaoConcluidas
console.log(`[Auto-Avanco] Pedido ${pedidoId}: Verificando ordens de producao...`);

// Antes de moverParaProximaEtapa
console.log(`[Auto-Avanco] Pedido ${pedidoId}: Iniciando moverParaProximaEtapa...`);

// Apos sucesso
console.log(`[Auto-Avanco] Pedido ${pedidoId}: Avanco concluido com sucesso`);
```

**2.2. Garantir Execucao do Callback**

No `useOrdemProducao.ts`, garantir que o callback `onOrdemConcluida` seja executado de forma assincrona robusta:

```typescript
// Em concluirOrdem.onSuccess
onSuccess: async (pedidoId) => {
  // ... invalidate queries ...

  // Tentar avanco automatico com try-catch
  if (onOrdemConcluida) {
    try {
      console.log('[concluirOrdem] Chamando onOrdemConcluida para pedido:', pedidoId);
      await onOrdemConcluida(pedidoId, tipoOrdem);
      console.log('[concluirOrdem] onOrdemConcluida executado com sucesso');
    } catch (error) {
      console.error('[concluirOrdem] Erro ao executar onOrdemConcluida:', error);
    }
  }
}
```

**2.3. Adicionar Fallback via Trigger no Banco**

Criar um trigger no banco de dados que verifica apos cada conclusao de ordem se o pedido pode avancar automaticamente. Isso serve como fallback caso o frontend falhe:

```sql
CREATE OR REPLACE FUNCTION public.verificar_avanco_automatico_producao()
RETURNS trigger AS $$
DECLARE
  v_pedido_id UUID;
  v_etapa_atual TEXT;
  v_linhas_pendentes INTEGER;
  v_ordens_nao_concluidas INTEGER;
BEGIN
  -- Buscar pedido_id da ordem
  v_pedido_id := NEW.pedido_id;
  
  -- Verificar etapa atual do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;
  
  -- Se nao esta em em_producao, nada a fazer
  IF v_etapa_atual != 'em_producao' THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se existem linhas pendentes
  SELECT COUNT(*) INTO v_linhas_pendentes
  FROM linhas_ordens
  WHERE pedido_id = v_pedido_id
    AND tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')
    AND concluida = false;
  
  -- Se tem linhas pendentes, nao avancar
  IF v_linhas_pendentes > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Verificar ordens ativas nao concluidas
  SELECT COUNT(*) INTO v_ordens_nao_concluidas
  FROM (
    SELECT 1 FROM ordens_soldagem WHERE pedido_id = v_pedido_id AND historico = false AND status != 'concluido'
    UNION ALL
    SELECT 1 FROM ordens_perfiladeira WHERE pedido_id = v_pedido_id AND historico = false AND status != 'concluido'
    UNION ALL
    SELECT 1 FROM ordens_separacao WHERE pedido_id = v_pedido_id AND historico = false AND status != 'concluido'
  ) ordens;
  
  IF v_ordens_nao_concluidas > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Todas condicoes atendidas: agendar avanco
  -- (Registrar em tabela de fila para processamento posterior pelo frontend)
  INSERT INTO pedidos_avanco_pendente (pedido_id, etapa_origem, created_at)
  VALUES (v_pedido_id, v_etapa_atual, NOW())
  ON CONFLICT (pedido_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Resumo das Mudancas

| Arquivo | Alteracao |
|---------|-----------|
| Nova migracao SQL | Corrigir pedido 0157 manualmente |
| `src/hooks/useOrdemProducao.ts` | Adicionar try-catch e logs ao chamar onOrdemConcluida |
| `src/hooks/usePedidoAutoAvanco.ts` | Adicionar logs detalhados em cada etapa |

---

### Resultado Esperado

1. Pedido 0157 estara em `inspecao_qualidade` com ordem de qualidade criada
2. Logs mais detalhados facilitarao debug de futuros problemas
3. Sistema mais resiliente a falhas de callback
