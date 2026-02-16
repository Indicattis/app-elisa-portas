
# Corrigir inconsistencia entre ordens concluidas e linhas pendentes

## Problema
Quando uma ordem de producao e marcada como "concluido", as linhas individuais na tabela `linhas_ordens` nem sempre sao atualizadas para `concluida = true`. Isso causa bloqueio no avanco do pedido porque a validacao verifica as linhas, nao as ordens principais.

## Causa raiz
O pedido foi retrocedido (backlog) e reprocessado. As novas ordens foram concluidas, mas as linhas individuais ficaram com `concluida = false`.

## Plano de correcao

### 1. Correcao imediata dos dados (SQL manual)
Atualizar as 13 linhas pendentes deste pedido para refletir o status real das ordens:

```text
UPDATE linhas_ordens 
SET concluida = true, concluida_em = NOW()
WHERE pedido_id = '9a381362-65f2-41cc-99bd-b5be2b724e61'
  AND tipo_ordem IN ('soldagem', 'separacao')
  AND concluida = false;
```

### 2. Correcao no codigo - validacao resiliente
**Arquivo:** `src/hooks/usePedidosEtapas.ts` (linhas 559-583)

Alterar a validacao de avanco da etapa `em_producao` para considerar tambem o status da ordem principal. Se a ordem na tabela principal esta como `concluido`, as linhas devem ser tratadas como concluidas mesmo que o campo `concluida` esteja desatualizado.

Logica proposta:
1. Buscar as ordens principais (ordens_soldagem, ordens_separacao, ordens_perfiladeira) e seus status
2. Se a ordem principal esta "concluido"/"pronta", ignorar linhas pendentes dessa ordem
3. Somente bloquear se a ordem principal tambem nao estiver concluida

### 3. Correcao preventiva - sincronizar linhas ao concluir ordem
Garantir que ao marcar uma ordem como concluida, todas as suas `linhas_ordens` vinculadas (via `ordem_id`) sejam automaticamente atualizadas para `concluida = true`. Verificar os fluxos de conclusao em:
- Hook de conclusao de ordens de soldagem
- Hook de conclusao de ordens de separacao  
- Hook de conclusao de ordens de perfiladeira

Adicionar em cada fluxo de conclusao um UPDATE nas linhas correspondentes.

## Arquivos envolvidos
- `src/hooks/usePedidosEtapas.ts` - validacao de avanco
- Hooks de conclusao de ordens (soldagem, separacao, perfiladeira) - sincronizacao preventiva
