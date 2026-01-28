
## Plano: Gerenciar Ordem de Pintura ao Retroceder para "Aguardando Pintura"

### Objetivo
Permitir que o usuario escolha o que acontece com a ordem de pintura ao retroceder um pedido para "Aguardando Pintura", similar ao gerenciamento de ordens de producao quando retorna para "Em Producao".

---

### Mudanca 1: Buscar Ordem de Pintura no Hook

**Arquivo:** `src/hooks/useRetrocederPedido.ts`

Adicionar busca da ordem de pintura e expandir interface:

```typescript
interface OrdemProducao {
  id: string;
  numero_ordem: string;
  status: string;
  tipo: 'soldagem' | 'perfiladeira' | 'separacao' | 'pintura';  // Adicionar pintura
  pausada?: boolean;
}

// Na queryFn, adicionar busca de ordem de pintura:
const { data: pintura } = await supabase
  .from('ordens_pintura')
  .select('id, numero_ordem, status, em_backlog')
  .eq('pedido_id', pedidoId)
  .maybeSingle();

if (pintura) {
  ordens.push({
    id: pintura.id,
    numero_ordem: pintura.numero_ordem || '',
    status: pintura.status || 'pendente',
    tipo: 'pintura',
    pausada: false,  // ordens_pintura nao tem campo pausada
  });
}
```

---

### Mudanca 2: Expandir Interface OrdemConfig

**Arquivo:** `src/hooks/useRetrocederPedido.ts`

```typescript
export interface OrdemConfig {
  tipo: 'soldagem' | 'perfiladeira' | 'separacao' | 'pintura';  // Adicionar pintura
  acao: 'manter' | 'pausar' | 'reativar' | 'resetar';  // Adicionar resetar
  justificativa?: string;
}
```

---

### Mudanca 3: Atualizar Modal para Mostrar Config de Pintura

**Arquivo:** `src/components/pedidos/RetrocederPedidoUnificadoModal.tsx`

Adicionar UI para gerenciar ordem de pintura quando destino e `aguardando_pintura`:

```typescript
const LABEL_TIPO_ORDEM: Record<string, string> = {
  soldagem: 'Soldagem',
  perfiladeira: 'Perfiladeira',
  separacao: 'Separacao',
  pintura: 'Pintura',  // Adicionar
};

// Filtrar ordem de pintura
const ordemPintura = ordensProducao.find(o => o.tipo === 'pintura');

// Na construcao de ordensConfigArray:
const ordensConfigArray: OrdemConfig[] = 
  etapaDestino === 'em_producao'
    ? ordensProducao.filter(o => o.tipo !== 'pintura').map(...)
    : etapaDestino === 'aguardando_pintura' && ordemPintura
    ? [{ tipo: 'pintura', acao: ordensConfig['pintura'] || 'resetar' }]
    : [];
```

UI para aguardando_pintura:
```tsx
{etapaDestino === 'aguardando_pintura' && ordemPintura && (
  <div className="space-y-3">
    <Label className="text-sm font-medium">Gerenciar Ordem de Pintura:</Label>
    <div className="border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">
          Pintura - {ordemPintura.numero_ordem || 'S/N'}
        </span>
        <Badge variant="outline" className="text-xs">
          {STATUS_LABELS[ordemPintura.status] || ordemPintura.status}
        </Badge>
      </div>
      
      <RadioGroup
        value={ordensConfig['pintura'] || 'resetar'}
        onValueChange={(value) => handleOrdemConfigChange('pintura', value)}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="resetar" id="pintura-resetar" />
          <Label htmlFor="pintura-resetar" className="text-xs cursor-pointer">
            Resetar ordem (status pendente, linhas desmarcadas)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="manter" id="pintura-manter" />
          <Label htmlFor="pintura-manter" className="text-xs cursor-pointer">
            Manter status atual
          </Label>
        </div>
      </RadioGroup>
    </div>
  </div>
)}
```

---

### Mudanca 4: Atualizar RPC para Aceitar Config de Pintura

**Arquivo:** Nova migration SQL

Modificar a funcao `retroceder_pedido_unificado` para processar config de pintura:

```sql
-- CASO 3: AGUARDANDO_PINTURA - agora com config
ELSIF p_etapa_destino = 'aguardando_pintura' THEN
  -- Excluir ordens posteriores
  DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
  DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
  
  -- Processar config de pintura se fornecida
  v_config := (SELECT jsonb_array_elements(p_ordens_config) 
               WHERE jsonb_array_elements->>'tipo' = 'pintura' LIMIT 1);
  v_acao := COALESCE(v_config->>'acao', 'resetar');
  
  IF v_acao = 'resetar' OR v_acao IS NULL THEN
    -- Comportamento padrao: resetar ordem
    IF NOT EXISTS (SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
      PERFORM criar_ordem_pintura(p_pedido_id);
    ELSE
      UPDATE ordens_pintura SET 
        status = 'pendente', 
        historico = false, 
        em_backlog = true,
        data_conclusao = NULL
      WHERE pedido_id = p_pedido_id;
      
      UPDATE linhas_ordens SET concluida = false 
      WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    END IF;
  ELSIF v_acao = 'manter' THEN
    -- Manter status atual da ordem
    UPDATE ordens_pintura SET em_backlog = true
    WHERE pedido_id = p_pedido_id;
  END IF;
  
  -- Atualizar pedido com backlog
  UPDATE pedidos_producao SET
    etapa_atual = 'aguardando_pintura',
    em_backlog = TRUE,
    updated_at = now()
  WHERE id = p_pedido_id;
END IF;
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useRetrocederPedido.ts` | Buscar ordem de pintura, expandir tipos |
| `src/components/pedidos/RetrocederPedidoUnificadoModal.tsx` | UI para gerenciar ordem de pintura |
| `supabase/migrations/xxx.sql` | Atualizar RPC para processar config de pintura |

---

### Fluxo Visual

```text
+------------------------------------------+
|   Retornar Pedido - Modal                |
+------------------------------------------+
| Pedido #001-01/26                        |
|                                          |
| Etapa Atual: [Instalacoes]               |
|                                          |
| Retornar para: [Aguardando Pintura v]    |
|                                          |
| Justificativa: *                         |
| +--------------------------------------+ |
| | Problemas na pintura identificados   | |
| +--------------------------------------+ |
|                                          |
| Gerenciar Ordem de Pintura:              |
| +--------------------------------------+ |
| | Pintura - OPT-2026-0001  [Concluido] | |
| |                                      | |
| | (o) Resetar ordem                    | |
| |     Status pendente, linhas reset   | |
| | ( ) Manter status atual              | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | i O que acontecera:                  | |
| | - Ordem de instalacao sera excluida  | |
| | - Ordem de pintura sera [resetada]   | |
| | - Pedido ficara em BACKLOG           | |
| +--------------------------------------+ |
|                                          |
| [Cancelar]  [Confirmar Retorno]          |
+------------------------------------------+
```

---

### Secao Tecnica

**Tipos Atualizados:**
```typescript
// useRetrocederPedido.ts
export interface OrdemConfig {
  tipo: 'soldagem' | 'perfiladeira' | 'separacao' | 'pintura';
  acao: 'manter' | 'pausar' | 'reativar' | 'resetar';
  justificativa?: string;
}
```

**Logica de Construcao do Array:**
```typescript
const ordensConfigArray: OrdemConfig[] = (() => {
  if (etapaDestino === 'em_producao') {
    return ordensProducao
      .filter(o => o.tipo !== 'pintura')
      .map(ordem => ({
        tipo: ordem.tipo,
        acao: ordensConfig[ordem.tipo] || 'manter',
      }));
  }
  if (etapaDestino === 'aguardando_pintura' && ordemPintura) {
    return [{
      tipo: 'pintura' as const,
      acao: (ordensConfig['pintura'] || 'resetar') as OrdemConfig['acao'],
    }];
  }
  return [];
})();
```
