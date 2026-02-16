
# Corrigir CHECK constraint da tabela pedidos_producao

## Problema
A tabela `pedidos_producao` possui a constraint `pedidos_producao_etapa_atual_check` na coluna `etapa_atual` que nao inclui `'embalagem'` na lista de valores permitidos. Isso impede que pedidos avancem para a etapa Embalagem.

## Valores atuais
aberto, aprovacao_ceo, em_producao, inspecao_qualidade, aguardando_pintura, aguardando_coleta, aguardando_instalacao, instalacoes, correcoes, finalizado

## Solucao
Uma migracao SQL que:
1. Remove a constraint antiga
2. Recria incluindo `'embalagem'`

```sql
ALTER TABLE pedidos_producao DROP CONSTRAINT pedidos_producao_etapa_atual_check;

ALTER TABLE pedidos_producao ADD CONSTRAINT pedidos_producao_etapa_atual_check
  CHECK (etapa_atual = ANY (ARRAY[
    'aberto', 'aprovacao_ceo', 'em_producao', 'inspecao_qualidade',
    'aguardando_pintura', 'embalagem', 'aguardando_coleta',
    'aguardando_instalacao', 'instalacoes', 'correcoes', 'finalizado'
  ]));
```

## Impacto
- Apenas migracao no banco, sem alteracao de codigo
- Apos aplicada, pedidos poderao avançar para Embalagem normalmente
