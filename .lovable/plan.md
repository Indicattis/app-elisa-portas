

## Plano: Corrigir data agendada um dia anterior na expedição mobile

### Problema
A data é salva como `"2026-04-15"` (sem sufixo de hora). O banco interpreta como meia-noite UTC, que no fuso BRT (UTC-3) vira o dia anterior. O padrão do projeto exige `T12:00:00` para evitar esse deslocamento.

### Solução

**Arquivo: `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`**

Na função `handleConfirm` (~linha 205), ao montar `data_carregamento`, anexar `T12:00:00`:

```typescript
data_carregamento: dataSelecionadaCalendario + "T12:00:00",
```

Isso garante que a data salva no banco não sofra deslocamento de timezone, seguindo o padrão já estabelecido no projeto.

### Escopo
- 1 arquivo, 1 linha alterada

