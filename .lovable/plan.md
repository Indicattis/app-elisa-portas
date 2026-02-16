
# Corrigir CHECK constraint da tabela pedidos_etapas

## Problema
A tabela `pedidos_etapas` possui uma CHECK constraint (`pedidos_etapas_etapa_check`) que lista os valores permitidos para a coluna `etapa`, mas **nao inclui o valor `'embalagem'`**. Por isso, ao tentar avançar um pedido para a etapa Embalagem, o banco rejeita a inserção com o erro `23514`.

## Valores atuais permitidos
- aberto, aprovacao_ceo, em_producao, inspecao_qualidade, aguardando_pintura, aguardando_coleta, aguardando_instalacao, instalacoes, correcoes, finalizado

## Solucao
Executar uma migracao SQL que:
1. Remove a constraint antiga (`pedidos_etapas_etapa_check`)
2. Recria a constraint incluindo `'embalagem'` na lista de valores validos

### Migracao SQL
```sql
ALTER TABLE pedidos_etapas DROP CONSTRAINT pedidos_etapas_etapa_check;

ALTER TABLE pedidos_etapas ADD CONSTRAINT pedidos_etapas_etapa_check
  CHECK (etapa = ANY (ARRAY[
    'aberto', 'aprovacao_ceo', 'em_producao', 'inspecao_qualidade',
    'aguardando_pintura', 'embalagem', 'aguardando_coleta',
    'aguardando_instalacao', 'instalacoes', 'correcoes', 'finalizado'
  ]));
```

## Impacto
- Nenhuma alteracao de codigo necessaria
- Apenas uma migracao no banco de dados
- Apos aplicada, os pedidos poderao avançar normalmente para a etapa Embalagem
