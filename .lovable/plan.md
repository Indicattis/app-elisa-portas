

# Corrigir datas das metas sendo salvas um dia anterior

## Problema

Ao criar/editar uma meta no `MetaDialog`, as datas de inicio e termino sao salvas um dia antes do selecionado. Isso ocorre porque o input `type="date"` retorna `YYYY-MM-DD` (sem horario), e o Supabase/PostgreSQL interpreta como `YYYY-MM-DDT00:00:00.000Z` (meia-noite UTC). No fuso de Brasilia (UTC-3), isso resulta no dia anterior.

## Solucao

Aplicar a padronizacao ja estabelecida no projeto: ao salvar, concatenar `T12:00:00.000Z` nas datas para garantir que a data local seja preservada apos conversao UTC.

## Detalhes tecnicos

**Editar `src/components/metas/MetaDialog.tsx`**:
- No `handleSubmit`, alterar `data_inicio` e `data_termino`:
  - De: `data_inicio: dataInicio` e `data_termino: dataTermino`
  - Para: `data_inicio: dataInicio + "T12:00:00.000Z"` e `data_termino: dataTermino + "T12:00:00.000Z"`

Apenas 2 linhas alteradas no objeto `metaData` dentro do `handleSubmit`.

### Arquivos

1. **Editar**: `src/components/metas/MetaDialog.tsx` -- concatenar `T12:00:00.000Z` nas datas

