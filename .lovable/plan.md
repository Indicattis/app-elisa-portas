

## Plano: Corrigir Ordem OSE-2026-0026 Marcada Como Historico

### Diagnostico

A ordem **#OSE-2026-0026** esta pausada e com status `pendente`, mas nao aparece na pagina `/producao/separacao` porque foi marcada incorretamente como **historico**.

| Campo | Valor |
|-------|-------|
| `status` | pendente |
| `pausada` | true |
| `justificativa_pausa` | Falta de motor 800AC |
| **`historico`** | **true** (PROBLEMA!) |

### Logica de Filtro Atual

O hook `useOrdemProducao.ts` busca apenas ordens com `historico = false`:

```typescript
// Linha 117
.eq('historico', false)
```

Depois filtra as ordens por status `pendente`:

```typescript
// Linha 558-559
const ordensAFazer = ordens
  .filter(o => o.status === 'pendente')
```

Como a ordem esta com `historico = true`, ela e excluida antes mesmo de chegar ao filtro de status.

### Correcao Necessaria

Executar uma migracao SQL para corrigir o campo `historico` desta ordem especifica:

```sql
UPDATE public.ordens_separacao 
SET historico = false
WHERE numero_ordem = 'OSE-2026-0026';
```

### Prevencao de Recorrencia

Idealmente, ao pausar uma ordem, o sistema deveria garantir que `historico` nunca seja marcado como `true`. No entanto, isso nao e o comportamento atual - a ordem provavelmente foi marcada como historico manualmente ou por outra acao.

Sugestao para implementacao futura: Adicionar uma validacao no banco (trigger) que impeca ordens pausadas de serem marcadas como historico.

### Arquivos a Modificar

| Tipo | Descricao |
|------|-----------|
| SQL Migration | Corrigir `historico = false` para OSE-2026-0026 |

### Resultado Esperado

Apos a correcao, a ordem **#OSE-2026-0026** aparecera na pagina `/producao/separacao` com o badge **PAUSADA** visivel, permitindo que operadores a recapturem.

