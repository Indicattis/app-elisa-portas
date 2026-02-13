

# Limitar captura de ordens de pintura a 3 por usuario

## Objetivo
Cada usuario so podera capturar no maximo 3 ordens de pintura simultaneamente. Se ja tiver 3 ordens capturadas (com `responsavel_id` igual ao usuario e status `pendente`), a captura sera bloqueada.

## Detalhes tecnicos

### Arquivo: `src/hooks/useOrdemPintura.ts`

Na funcao `capturarOrdem.mutationFn` (linha 217), antes de fazer o update, adicionar uma verificacao:

1. Contar quantas ordens de pintura o usuario atual ja tem capturadas (onde `responsavel_id = user.id` e `historico = false`)
2. Se o total for >= 3, lancar erro com mensagem explicativa
3. O toast de erro ja exibe `error.message`, entao a mensagem aparecera automaticamente para o usuario

```text
Fluxo:
  Usuario clica "Capturar"
    -> Buscar contagem de ordens com responsavel_id = user.id e historico = false
    -> Se >= 3: erro "Voce ja possui 3 ordens capturadas. Finalize uma antes de capturar outra."
    -> Se < 3: prosseguir com captura normalmente
```

### Arquivo unico editado
- `src/hooks/useOrdemPintura.ts` -- adicionar query de contagem antes do update na mutationFn de `capturarOrdem`

