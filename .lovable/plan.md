
# Plano: Corrigir Exibicao de Data de Carregamento (Problema de Timezone)

## Diagnostico do Problema

### Dados encontrados no banco:
- Tabela `instalacoes` para pedido 0092: `data_carregamento = '2026-02-02'` (correto)
- Tabela `ordens_carregamento`: registro antigo com `data_carregamento = null`

### Causa raiz:
O codigo em `PedidoCard.tsx` usa `new Date(dataCarregamento)` para interpretar a string de data. Quando JavaScript recebe uma string no formato `'2026-02-02'`:
- Interpreta como UTC: `2026-02-02T00:00:00Z`
- No fuso horario de Sao Paulo (UTC-3), isso vira `2026-02-01T21:00:00-03:00`
- Ao formatar com `format()`, mostra **01/02** em vez de **02/02**

### Solucao padrao do projeto:
O projeto ja usa `parseISO()` do date-fns em 31 arquivos para evitar esse problema. A funcao `parseISO` interpreta a data como local, mantendo o dia correto.

---

## Correcao Proposta

### Modificar `src/components/pedidos/PedidoCard.tsx`

Substituir todas as instancias de `new Date(dataCarregamento)` por `parseISO(dataCarregamento)`:

**Linhas afetadas:**
- Linha 1181: `format(new Date(dataCarregamento), "dd/MM/yy")`
- Linha 1197: `const dataCarreg = new Date(dataCarregamento);`
- Linha 1215: `format(new Date(dataCarregamento), "dd/MM/yy")`
- Linha 1225: `format(new Date(dataCarregamento), "dd/MM/yy")`
- Linha 1707: `format(new Date(dataCarregamento), "dd/MM/yyyy")`

**Codigo corrigido:**
```typescript
// Adicionar import
import { format, parseISO } from "date-fns";

// Linha 1181
{format(parseISO(dataCarregamento), "dd/MM/yy")}

// Linha 1197
const dataCarreg = parseISO(dataCarregamento);

// Linha 1215
{format(parseISO(dataCarregamento), "dd/MM/yy")}

// Linha 1225
{format(parseISO(dataCarregamento), "dd/MM/yy")}

// Linha 1707
{format(parseISO(dataCarregamento), "dd/MM/yyyy")}
```

---

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/pedidos/PedidoCard.tsx` | Modificar | Substituir `new Date()` por `parseISO()` para datas de carregamento |

---

## Resultado Esperado

Apos a correcao, o pedido 0092 exibira corretamente:
- Data de carregamento: **02/02/26** (em vez de 01/02/26)

Esta correcao tambem previne o mesmo problema em outros pedidos com datas de carregamento.
