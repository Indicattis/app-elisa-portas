

## Plano: Bloquear Regeneracao de Linhas em Ordens Concluidas

### Problema
O sistema permite tentar regenerar linhas de ordens ja concluidas, causando erro.

### Solucao

**1. Atualizar funcao SQL `regenerar_linhas_ordem`**

Adicionar verificacao do status da ordem antes de permitir regeneracao:

```sql
-- Apos buscar v_pedido_id, adicionar verificacao de status
DECLARE
  v_status TEXT;
BEGIN
  -- Buscar pedido_id e status
  CASE p_tipo_ordem
    WHEN 'soldagem' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_soldagem WHERE id = p_ordem_id;
    WHEN 'perfiladeira' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_perfiladeira WHERE id = p_ordem_id;
    WHEN 'separacao' THEN
      SELECT pedido_id, status INTO v_pedido_id, v_status 
      FROM ordens_separacao WHERE id = p_ordem_id;
  END CASE;

  -- Verificar se ordem esta concluida
  IF v_status = 'concluido' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Nao e possivel regenerar linhas de uma ordem concluida'
    );
  END IF;
```

**2. Atualizar componente `OrdemLinhasSheet.tsx`**

Desabilitar botao e mostrar tooltip apropriado quando ordem estiver concluida:

```typescript
// Verificar se ordem esta concluida
const isOrdemConcluida = ordem?.status === 'concluido';

// No botao:
<Button
  disabled={regenerarLinhas.isPending || isOrdemConcluida}
  className={cn("h-7 w-7", isOrdemConcluida && "opacity-50")}
>
  ...
</Button>

// No tooltip:
<TooltipContent>
  {isOrdemConcluida 
    ? 'Ordem concluída - não é possível regenerar' 
    : 'Regenerar linhas da ordem'}
</TooltipContent>
```

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/migrations/xxx.sql` | Nova migration para atualizar funcao RPC |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Desabilitar botao + tooltip condicional |

### Comportamento Esperado

- **Ordem Pendente/Em andamento**: Botao habilitado, regeneracao funciona
- **Ordem Concluida**: Botao desabilitado com tooltip explicativo, RPC retorna erro caso chamada diretamente

