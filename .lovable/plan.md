

# Correcao do erro ao concluir ordem de separacao

## Problema

A tabela `pontuacao_colaboradores` possui uma CHECK constraint (`pontuacao_colaboradores_tipo_ranking_check`) que so aceita os valores `'pintura'`, `'perfiladeira'` e `'solda'` na coluna `tipo_ranking`. Porem, ao concluir uma ordem de separacao, o sistema tenta inserir uma linha com `tipo_ranking = 'separacao'`, o que viola essa restricao e gera o erro `23514`.

## Solucao

Executar uma migracao SQL para atualizar a CHECK constraint, adicionando `'separacao'` como valor permitido:

```sql
ALTER TABLE pontuacao_colaboradores
  DROP CONSTRAINT pontuacao_colaboradores_tipo_ranking_check;

ALTER TABLE pontuacao_colaboradores
  ADD CONSTRAINT pontuacao_colaboradores_tipo_ranking_check
  CHECK (tipo_ranking = ANY (ARRAY['pintura', 'perfiladeira', 'solda', 'separacao']));
```

## Detalhes tecnicos

- **Arquivo afetado**: Nenhum arquivo de codigo precisa ser alterado. O problema esta exclusivamente no banco de dados.
- **Risco**: Nenhum. A constraint apenas sera expandida para aceitar um valor adicional que ja e utilizado pelo codigo.
- **Impacto**: Ordens de separacao poderao ser concluidas normalmente, registrando a pontuacao do colaborador.

