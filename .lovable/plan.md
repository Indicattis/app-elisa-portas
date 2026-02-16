
# Corrigir verificacao de ordem de pintura concluida

## Problema
O pedido `601eb600` esta preso na etapa "Aguardando Pintura" mesmo com a ordem de pintura concluida. Ao tentar avancar manualmente, aparece a mensagem "Conclua a ordem de pintura antes de avancar para expedicao".

## Causa raiz
A funcao SQL `verificar_ordem_pintura_concluida` (usada pelo PedidoCard para habilitar o botao de avanco) verifica se o status da ordem e `'pronta'`, mas a ordem esta com status `'concluido'`. A funcao retorna `false` incorretamente.

Da mesma forma, o hook `usePedidoAutoAvanco` na funcao `verificarOrdemPinturaConcluida` tambem verifica apenas `status === 'pronta'`.

## Solucao

### 1. Atualizar funcao SQL `verificar_ordem_pintura_concluida`
Alterar a verificacao para aceitar ambos os status `'pronta'` e `'concluido'`:

```sql
CREATE OR REPLACE FUNCTION public.verificar_ordem_pintura_concluida(p_pedido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM ordens_pintura
  WHERE pedido_id = p_pedido_id
  LIMIT 1;
  
  IF v_status IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN v_status IN ('pronta', 'concluido');
END;
$function$;
```

### 2. Atualizar hook `usePedidoAutoAvanco.ts`
Na funcao `verificarOrdemPinturaConcluida` (linha 139), alterar:
- De: `ordemPintura.status === 'pronta'`
- Para: `ordemPintura.status === 'pronta' || ordemPintura.status === 'concluido'`

## Arquivos alterados
- Migracao SQL (nova) - atualizar funcao `verificar_ordem_pintura_concluida`
- `src/hooks/usePedidoAutoAvanco.ts` - aceitar ambos os status na verificacao do hook

## Impacto
- O pedido `601eb600` podera ser avancado manualmente imediatamente apos a correcao
- Futuros pedidos com ordens de pintura marcadas como `concluido` tambem serao tratados corretamente
- Nenhuma alteracao no fluxo normal de producao
