
# Correcao: Remover Instalacao do Calendario - Status Invalido

## Problema

Ao remover uma instalacao do calendario, o codigo define `status: 'pendente'`, mas a tabela `instalacoes` so aceita os seguintes valores (check constraint `instalacoes_status_check`):

- `pendente_producao`
- `pronta_fabrica`
- `finalizada`

O status `'pendente'` e valido apenas para a tabela `ordens_carregamento`, nao para `instalacoes`.

## Correcao

### Arquivo: `src/pages/logistica/ExpedicaoMinimalista.tsx`

Na funcao `handleRemoverDoCalendario` (linha 119), usar o status correto conforme a fonte:

```typescript
// ANTES (bug):
status: 'pendente',

// DEPOIS (corrigido):
status: fonte === 'instalacoes' ? 'pendente_producao' : 'pendente',
```

Isso garante que ao remover do calendario:
- **Ordens de carregamento**: voltam para `pendente`
- **Instalacoes**: voltam para `pendente_producao`

### Resultado Esperado

- Remover instalacoes do calendario funcionara sem erro
- O status sera consistente com as regras de cada tabela
- Apenas 1 linha alterada em 1 arquivo
