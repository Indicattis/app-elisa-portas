
# Corrigir erro ao recapturar ordem pausada de qualidade

## Problema

Ao tentar recapturar uma ordem de qualidade que estava pausada, o sistema tenta atualizar a coluna `linha_problema_id` na tabela `ordens_qualidade`, mas essa coluna nao existe nessa tabela. Isso causa o erro `PGRST204`.

O erro esta na linha 329 do arquivo `src/hooks/useOrdemProducao.ts`, dentro da logica de captura de ordens pausadas, onde `linha_problema_id = null` e adicionado ao update sem verificar se o tipo da ordem e qualidade.

## Solucao

Adicionar a mesma verificacao que ja existe na logica de conclusao (linha 538): so incluir `linha_problema_id` no update se `tipoOrdem !== 'qualidade'`.

## Detalhes tecnicos

### Arquivo: `src/hooks/useOrdemProducao.ts`

Na funcao `capturarOrdem` (linha 329), envolver a atribuicao de `linha_problema_id` com a condicao:

```typescript
// Antes (linha 329):
updateData.linha_problema_id = null;

// Depois:
if (tipoOrdem !== 'qualidade') {
  updateData.linha_problema_id = null;
}
```

Isso replica o mesmo padrao ja usado na funcao `concluirOrdem` (linhas 537-540).

### Arquivo editado

1. **Editar**: `src/hooks/useOrdemProducao.ts` (linha 329)
