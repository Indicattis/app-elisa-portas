## Diagnóstico

Pedido **0309** (`08e4eddf-ca28-40c8-9b86-150db8fdf18b`, etapa `em_producao`):

- Ordens de soldagem, perfiladeira e separação estão `status = 'concluido'` e `historico = true`.
- Porém, no banco, **6 linhas continuam com `concluida = false`**:
  - 4 linhas em `soldagem` (ordem `69bb7d35…`)
  - 2 linhas em `perfiladeira` (ordem `89ed5047…`)
- Por isso o `usePedidoAutoAvanco` bloqueia (linha 30: `linhas.every(l => l.concluida === true)`).

### Causa raiz

Em `OrdemLinhasSheet.tsx`, ao concluir a ordem em `/fabrica/ordens-pedidos`, o código tenta:

```ts
await supabase.from('linhas_ordens').update({ concluida: true, ... })
  .eq('ordem_id', ordem.id).eq('tipo_ordem', ordem.tipo).eq('concluida', false);
```

As políticas RLS de UPDATE em `linhas_ordens` exigem uma destas três:
1. `pode_marcar_linhas_ordem(ordem_id, tipo_ordem)` — só passa se o usuário for o `responsavel_id` da ordem.
2. `is_factory_operator(auth.uid())` — só passa se o `setor = 'fabrica'`.
3. `is_admin()` — só passa para admins do `admin_users`.

Quando um usuário fora desses três perfis (ou um admin atuando antes de a sessão ter `is_admin()` resolvido) clica em "Concluir" pela tela administrativa, o UPDATE retorna **0 linhas afetadas sem erro** (RLS silencioso). A UI considera sucesso, marca a ordem como concluída, mas as linhas ficam pendentes — exatamente o estado atual do pedido.

A mesma falha vale para qualquer "conclusão administrativa" que não rode com elevação adequada.

## Plano de correção

### 1. Corrigir o pedido 0309 imediatamente (data fix)

Migration única para marcar como concluídas as linhas órfãs cuja ordem está concluída:

```sql
UPDATE linhas_ordens l
SET concluida = true,
    concluida_em = COALESCE(concluida_em, now()),
    updated_at = now()
WHERE l.pedido_id = '08e4eddf-ca28-40c8-9b86-150db8fdf18b'
  AND l.tipo_ordem IN ('soldagem','perfiladeira')
  AND l.concluida = false;
```

Após isso, o avanço manual do pedido funciona normalmente.

### 2. Prevenir o problema de forma definitiva (RPC com SECURITY DEFINER)

Substituir o UPDATE direto no `OrdemLinhasSheet.tsx` por uma RPC que executa com `SECURITY DEFINER`, garantindo que a conclusão administrativa marque as linhas mesmo quando o usuário não é o responsável atribuído.

**Migration**: criar `concluir_ordem_administrativa(p_ordem_id uuid, p_tipo_ordem text, p_tempo_segundos int)`:

- Verifica que o caller é `is_admin()` OU `is_factory_operator(auth.uid())` (senão `RAISE EXCEPTION`).
- Faz `UPDATE linhas_ordens SET concluida = true, concluida_em = now(), concluida_por = auth.uid() WHERE ordem_id = p_ordem_id AND tipo_ordem = p_tipo_ordem`.
- Faz o `UPDATE` correspondente em `ordens_<tipo>` setando `status='concluido'`, `historico=true`, `data_conclusao=now()`, `tempo_conclusao_segundos = p_tempo_segundos`.
- Retorna o número de linhas atualizadas (para auditoria).

**Frontend** (`src/components/fabrica/OrdemLinhasSheet.tsx`, mutation `concluirOrdem` linhas 239-292):

- Substituir os dois `update` separados por uma única chamada `supabase.rpc('concluir_ordem_administrativa', { p_ordem_id, p_tipo_ordem, p_tempo_segundos })`.
- Tratar erro retornado pela RPC (sem mais "sucesso silencioso").

### 3. Salvaguarda no auto-avanço (defensivo)

Ainda em `OrdemLinhasSheet.tsx → onSuccess`, após a RPC retornar, validar:
- Se `linhas_atualizadas < linhas_pendentes_esperadas`, mostrar `toast.error` em vez de fechar o sheet.

Isso impede que falhas futuras da RPC (ex.: nova policy) passem despercebidas.

## Arquivos afetados

- **Migration nova**: data-fix do pedido 0309 + criação da função `concluir_ordem_administrativa`.
- **Editado**: `src/components/fabrica/OrdemLinhasSheet.tsx` — mutation `concluirOrdem` passa a usar RPC.

## Resultado esperado

- Pedido 0309 avança normalmente após o data-fix.
- Conclusões futuras pela tela `/fabrica/ordens-pedidos` marcam as linhas atomicamente, eliminando o erro "há linhas para serem concluídas".
