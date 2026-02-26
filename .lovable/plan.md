

# Corrigir erro "Invalid time value" na pagina de Faturamento

## Problema

A pagina esta quebrando com `RangeError: Invalid time value` ao tentar formatar datas. O campo `data_venda` pode vir do banco em formato timestamp completo (ex: `"2024-01-15T03:00:00.000Z"`) ou como string vazia. Ao concatenar `+ 'T12:00:00'`, o resultado fica invalido (ex: `"2024-01-15T03:00:00.000ZT12:00:00"`), causando o erro no `format()`.

## Solucao

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

1. **Criar funcao auxiliar `safeParseDate`** que:
   - Recebe uma string de data (pode ser `"2024-01-15"`, `"2024-01-15T03:00:00.000Z"`, `""`, `null`, etc.)
   - Extrai apenas a parte `YYYY-MM-DD` (primeiros 10 caracteres)
   - Concatena `T12:00:00` de forma segura
   - Retorna `null` se a data for invalida

2. **Substituir os dois pontos de `format(new Date(...))`** (linhas 781 e 950) para usar `safeParseDate`, com fallback para "-" caso retorne null

Isso corrige o crash sem alterar a logica visual da pagina.
