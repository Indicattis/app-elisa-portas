
# Corrigir exibicao das datas nas metas (MetaCard)

## Problema

O salvamento ja esta correto (com `T12:00:00.000Z`), porem o banco retorna as datas no formato `"2026-02-09"` (somente data, sem horario). Ao fazer `new Date("2026-02-09")`, o JavaScript interpreta como UTC meia-noite, que no fuso de Brasilia (UTC-3) vira 08/02 as 21h -- exibindo o dia anterior.

## Solucao

No `MetaCard.tsx`, ao formatar as datas para exibicao, adicionar `T12:00:00` antes de criar o `Date`, garantindo que a conversao de fuso nao altere o dia.

## Detalhes tecnicos

**Editar `src/components/metas/MetaCard.tsx`** (linha 87):

De:
```typescript
{format(new Date(meta.data_inicio), "dd/MM")} - {format(new Date(meta.data_termino), "dd/MM")}
```

Para:
```typescript
{format(new Date(meta.data_inicio + "T12:00:00"), "dd/MM")} - {format(new Date(meta.data_termino + "T12:00:00"), "dd/MM")}
```

Tambem corrigir as linhas 32-34 onde `data_termino` e usada para calcular dias restantes:

De:
```typescript
const dataTermino = new Date(meta.data_termino);
```

Para:
```typescript
const dataTermino = new Date(meta.data_termino + "T12:00:00");
```

### Arquivos

1. **Editar**: `src/components/metas/MetaCard.tsx` -- 2 alteracoes para corrigir parsing de datas
