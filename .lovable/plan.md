
# Corrigir erro ao concluir instalacao em /logistica/instalacoes/ordens-instalacoes

## Problema

Ao concluir uma instalacao, o codigo define `status: 'concluida'` na tabela `instalacoes`, mas a constraint `instalacoes_status_check` so permite os valores:
- `pendente_producao`
- `pronta_fabrica`
- `finalizada`

O valor `'concluida'` nao e permitido, causando o erro `23514`.

## Solucao

Alterar o valor do status de `'concluida'` para `'finalizada'` na funcao `concluirOrdemMutation` do hook `useOrdensInstalacao.ts`.

## Detalhes tecnicos

### Arquivo: `src/hooks/useOrdensInstalacao.ts`

Na linha 176, dentro da funcao `concluirOrdemMutation`, trocar:

```typescript
// Antes:
status: 'concluida',

// Depois:
status: 'finalizada',
```

Apenas uma linha precisa ser alterada.
