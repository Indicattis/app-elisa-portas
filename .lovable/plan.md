
# Plano: Corrigir Erro ON CONFLICT na Conclusão de Carregamento

## Problema Identificado

O erro `there is no unique or exclusion constraint matching the ON CONFLICT specification` ocorre porque:

1. A função `concluir_carregamento_e_avancar_pedido` usa `ON CONFLICT (pedido_id, etapa)` na linha 92:
```sql
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
VALUES (v_pedido_id, 'finalizado', now(), '[]'::jsonb)
ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now();
```

2. **A tabela `pedidos_etapas` NÃO possui um constraint UNIQUE em `(pedido_id, etapa)`**

3. Existem **35 conjuntos de registros duplicados** na tabela que impedem a criação direta do constraint

## Solucao

Criar uma migration SQL que:

### 1. Limpar Duplicatas
Remover registros duplicados mantendo o mais recente (por `data_entrada` ou `created_at`):
```sql
DELETE FROM pedidos_etapas a
USING pedidos_etapas b
WHERE a.pedido_id = b.pedido_id 
  AND a.etapa = b.etapa
  AND a.id < b.id;
```

### 2. Criar Constraint UNIQUE
```sql
ALTER TABLE pedidos_etapas 
ADD CONSTRAINT pedidos_etapas_pedido_id_etapa_unique 
UNIQUE (pedido_id, etapa);
```

## Resultado Esperado

- A conclusão de carregamentos funcionara normalmente
- Nao havera mais duplicatas na tabela de etapas
- O sistema podera usar ON CONFLICT corretamente
