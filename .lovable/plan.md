

## Plano: Corrigir Bug de Avanço Automático para Ordens Pausadas Concluídas

### Diagnóstico

O pedido **#0081** não avançou automaticamente após a conclusão da ordem de separação porque:

1. **Estado atual da ordem OSE-2026-0026:**
   - `status: concluido`
   - `pausada: true` (PROBLEMA!)
   - `historico: true`

2. **Lógica de verificação no auto-avanço:**
   ```typescript
   // usePedidoAutoAvanco.ts linha 50-51
   if (ordens.some(o => o.pausada === true)) {
     return false; // Bloqueia avanço
   }
   ```

3. **Causa raiz:** Ao concluir uma ordem no `useOrdemProducao.ts`, o código não reseta o campo `pausada`:
   ```typescript
   // Linha 504-512
   .update({ 
     status: 'concluido',
     data_conclusao: new Date().toISOString(),
     historico: true,
     // FALTA: pausada: false
   })
   ```

### Solução

#### 1. Corrigir a mutação `concluirOrdem` no hook

**Arquivo:** `src/hooks/useOrdemProducao.ts`

Adicionar reset dos campos de pausa ao concluir a ordem:

```typescript
// Atualizar ordem como concluída E enviar para histórico
const { error } = await supabase
  .from(tabelaOrdem)
  .update({ 
    status: 'concluido',
    data_conclusao: new Date().toISOString(),
    tempo_conclusao_segundos,
    historico: true,
    // ADICIONAR:
    pausada: false,
    pausada_em: null,
    justificativa_pausa: null,
    linha_problema_id: null,
  })
  .eq('id', ordemId);
```

#### 2. Corrigir dados existentes no banco

Executar SQL para resetar `pausada` em todas as ordens concluídas que ainda estão marcadas como pausadas:

```sql
-- Corrigir ordens de separação
UPDATE public.ordens_separacao 
SET pausada = false, pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;

-- Corrigir ordens de soldagem (preventivo)
UPDATE public.ordens_soldagem 
SET pausada = false, pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;

-- Corrigir ordens de perfiladeira (preventivo)
UPDATE public.ordens_perfiladeira 
SET pausada = false, pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;
```

#### 3. Avançar o pedido manualmente

Após as correções, executar o avanço do pedido #0081 de `em_producao` para `inspecao_qualidade`:

```sql
UPDATE public.pedidos_producao 
SET etapa_atual = 'inspecao_qualidade'
WHERE id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useOrdemProducao.ts` | Adicionar reset de pausada na mutação concluirOrdem |
| SQL Migration | Corrigir dados existentes e avançar pedido |

### Fluxo Corrigido

```text
Antes (bug):
  Ordem pausada → Concluir → status=concluido, pausada=true → Auto-avanço bloqueado

Depois (fix):
  Ordem pausada → Concluir → status=concluido, pausada=false → Auto-avanço funciona
```

### Impacto

- Todas as futuras ordens pausadas que forem concluídas terão o flag `pausada` resetado
- Pedidos avançarão automaticamente após conclusão de todas as ordens
- Dados históricos inconsistentes serão corrigidos

