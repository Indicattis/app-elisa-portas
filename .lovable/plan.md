
# Correcao: Contabilizacao de Metragem na Meta do Colaborador

## Problema Identificado

O filtro de data nas queries de progresso usa `.lte("data_conclusao", data_termino)` onde `data_termino` e uma string de data sem horario (ex: `"2026-02-06"`). O Supabase interpreta como `2026-02-06T00:00:00`, excluindo todas as ordens concluidas **durante** o ultimo dia da meta.

No caso do Joao Vitor, 2.486,25m de metragem estao sendo ignorados (ordens OPE-2026-0031 e OPE-2026-0058 concluidas em 06/02).

## Correcao

Alterar o filtro `lte` para incluir o dia inteiro do termino, adicionando `T23:59:59` ao `data_termino`.

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useMetaProgressoCalculado.ts` | Corrigir `.lte("data_conclusao", data_termino)` para `.lte("data_conclusao", data_termino + "T23:59:59")` em todos os 6 cases do switch |
| `src/components/metas/MetaProgressoBar.tsx` | Mesma correcao nos 6 cases do switch dentro da queryFn |

### Detalhes Tecnicos

Em ambos os arquivos, cada `case` do switch faz:

```typescript
// ANTES (bug):
.lte("data_conclusao", data_termino)

// DEPOIS (corrigido):
.lte("data_conclusao", data_termino + "T23:59:59")
```

Tambem aplicar a mesma logica ao `data_inicio` para consistencia:

```typescript
// data_inicio ja esta correto com .gte() pois "2026-01-31" = "2026-01-31T00:00:00"
// que inclui o dia inteiro a partir da meia-noite. Nenhuma mudanca necessaria.
```

### Resultado Esperado

- Progresso do Joao Vitor passara de ~2.833m para ~5.319m (53% da meta de 10.000m)
- Todas as ordens concluidas no ultimo dia da meta serao contabilizadas corretamente
- Correcao beneficia todos os colaboradores e todos os tipos de meta
