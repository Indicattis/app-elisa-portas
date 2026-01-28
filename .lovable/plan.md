
## Plano: Sistema Unificado de Retrocesso de Pedidos

### Objetivo

Criar um sistema de retrocesso padronizado que funcione em:
- `/logistica/instalacoes/ordens-instalacoes` (nova funcionalidade)
- `/direcao/gestao-fabrica` (refatorar modal existente)

### Regras de Retrocesso por Etapa Destino

| Etapa Destino | Acao | UI do Modal |
|---------------|------|-------------|
| **Em Aberto** | Exclui TODAS as ordens (soldagem, perfiladeira, separacao, qualidade, pintura, instalacao, carregamento) | Apenas campo de motivo |
| **Em Producao** | Exclui ordens das etapas posteriores (qualidade, pintura, instalacao, carregamento). Usuario gerencia ordens de producao (manter/pausar/reativar) | Campo de motivo + painel de gerenciamento de ordens |
| **Aguardando Pintura** | Exclui ordens posteriores (instalacao, carregamento). Recria ordem de pintura | Campo de motivo + aviso de recriacao |

### Arquitetura

```text
+-----------------------------------------------+
|          RetrocederPedidoUnificadoModal       |
|  (componente unificado para todo o sistema)   |
+-----------------------------------------------+
           |
           v
+-----------------------------------------------+
|  useRetrocederPedido (novo hook unificado)    |
|  - Busca ordens de producao do pedido         |
|  - Executa RPC com configuracao de ordens     |
+-----------------------------------------------+
           |
           v
+-----------------------------------------------+
|  retroceder_pedido_unificado (nova RPC)       |
|  - Logica condicional por etapa destino       |
|  - Gerenciamento de ordens de producao        |
|  - Recriacao de ordens quando necessario      |
+-----------------------------------------------+
```

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/pedidos/RetrocederPedidoUnificadoModal.tsx` | Criar | Modal unificado com logica condicional |
| `src/hooks/useRetrocederPedido.ts` | Criar | Hook para gerenciar retrocesso |
| `src/components/instalacoes/OrdemInstalacaoRow.tsx` | Modificar | Adicionar botao de retroceder |
| `src/pages/logistica/OrdensInstalacoesLogistica.tsx` | Modificar | Integrar modal de retrocesso |
| `src/components/pedidos/RetrocederEtapaModal.tsx` | Modificar | Refatorar para usar modal unificado |
| Migration SQL | Criar | Nova funcao RPC `retroceder_pedido_unificado` |

---

### Mudanca 1: Hook useRetrocederPedido.ts

```typescript
interface OrdemProducao {
  id: string;
  numero_ordem: string;
  status: string;
  tipo: 'soldagem' | 'perfiladeira' | 'separacao';
}

interface OrdemConfig {
  tipo: string;
  acao: 'manter' | 'pausar' | 'reativar';
  justificativa?: string;
}

interface RetrocederParams {
  pedidoId: string;
  etapaDestino: EtapaPedido;
  motivo: string;
  ordensConfig?: OrdemConfig[]; // Apenas para etapa 'em_producao'
}

export function useRetrocederPedido(pedidoId: string) {
  // Query para buscar ordens de producao do pedido
  const { data: ordensProducao, isLoading } = useQuery({
    queryKey: ['ordens-producao-pedido', pedidoId],
    queryFn: async () => { /* buscar soldagem, perfiladeira, separacao */ }
  });

  // Mutation para executar retrocesso
  const retrocederPedido = useMutation({
    mutationFn: async (params: RetrocederParams) => {
      const { error } = await supabase.rpc('retroceder_pedido_unificado', {
        p_pedido_id: params.pedidoId,
        p_etapa_destino: params.etapaDestino,
        p_motivo: params.motivo,
        p_ordens_config: params.ordensConfig || [],
        p_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar todas as queries relevantes
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-instalacao'] });
      // ... etc
    }
  });

  return { ordensProducao, isLoading, retrocederPedido };
}
```

---

### Mudanca 2: RetrocederPedidoUnificadoModal.tsx

Modal com tres modos de exibicao baseado na etapa destino:

**Modo 1: Retornar para "Em Aberto"**
```text
+------------------------------------------+
|  [!] Retornar Pedido (Backlog)           |
+------------------------------------------+
|  Pedido: #0123                           |
|  Etapa Atual: [Badge Instalacoes]        |
|                                          |
|  Retornar para: [Em Aberto v]            |
|                                          |
|  Justificativa: *                        |
|  [________________________]              |
|  [________________________]              |
|                                          |
|  +-- AVISO DESTRUTIVO -----------------+ |
|  | Esta acao IRA:                       | |
|  | - Excluir TODAS as ordens           | |
|  | - Ordem de instalacao sera excluida | |
|  | - Pedido voltara para o inicio      | |
|  +-------------------------------------+ |
|                                          |
|  [Cancelar]     [Confirmar Retorno]      |
+------------------------------------------+
```

**Modo 2: Retornar para "Em Producao"**
```text
+------------------------------------------+
|  [!] Retornar Pedido (Backlog)           |
+------------------------------------------+
|  Pedido: #0123                           |
|  Etapa Atual: [Badge Instalacoes]        |
|                                          |
|  Retornar para: [Em Producao v]          |
|                                          |
|  Justificativa Geral: *                  |
|  [________________________]              |
|                                          |
|  +-- Gerenciar Ordens de Producao -----+ |
|  |                                      | |
|  | [Soldagem] #S-0123  [Concluido]     | |
|  |   ( ) Manter status atual           | |
|  |   ( ) Pausar ordem                  | |
|  |   (*) Reativar ordem                | |
|  |                                      | |
|  | [Perfiladeira] #P-0123  [Em And.]   | |
|  |   (*) Manter status atual           | |
|  |   ( ) Pausar ordem                  | |
|  |   ( ) Reativar ordem                | |
|  |                                      | |
|  +-------------------------------------+ |
|                                          |
|  +-- AVISO -----+ |
|  | Ordens de qualidade, pintura e      | |
|  | instalacao serao excluidas.         | |
|  +-------------------------------------+ |
|                                          |
|  [Cancelar]     [Confirmar Retorno]      |
+------------------------------------------+
```

**Modo 3: Retornar para "Aguardando Pintura"**
```text
+------------------------------------------+
|  [!] Retornar Pedido (Backlog)           |
+------------------------------------------+
|  Pedido: #0123                           |
|  Etapa Atual: [Badge Instalacoes]        |
|                                          |
|  Retornar para: [Aguardando Pintura v]   |
|                                          |
|  Justificativa: *                        |
|  [________________________]              |
|                                          |
|  +-- INFO ------+ |
|  | - Ordem de pintura sera recriada    | |
|  | - Ordem de instalacao sera excluida | |
|  +-------------------------------------+ |
|                                          |
|  [Cancelar]     [Confirmar Retorno]      |
+------------------------------------------+
```

---

### Mudanca 3: Nova Funcao RPC

```sql
CREATE OR REPLACE FUNCTION public.retroceder_pedido_unificado(
  p_pedido_id UUID,
  p_etapa_destino TEXT,
  p_motivo TEXT,
  p_ordens_config JSONB DEFAULT '[]'::JSONB,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_etapa_atual TEXT;
  v_tem_pintura BOOLEAN;
  v_config JSONB;
  v_tipo TEXT;
  v_acao TEXT;
  v_justificativa TEXT;
BEGIN
  -- Buscar etapa atual
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao WHERE id = p_pedido_id;

  -- Verificar se pedido tem pintura contratada
  SELECT EXISTS(
    SELECT 1 FROM vendas v
    JOIN pedidos_producao p ON p.venda_id = v.id
    WHERE p.id = p_pedido_id
    AND (v.valor_pintura > 0 OR EXISTS(
      SELECT 1 FROM produtos_vendas pv 
      WHERE pv.venda_id = v.id AND pv.tipo_produto = 'pintura_epoxi'
    ))
  ) INTO v_tem_pintura;

  -- =============================================
  -- CASO 1: Retornar para ABERTO
  -- Exclui TODAS as ordens
  -- =============================================
  IF p_etapa_destino = 'aberto' THEN
    -- Excluir pontuacoes
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = p_pedido_id);
    
    -- Excluir todas as linhas de ordens
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    
    -- Excluir todas as ordens
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    
    -- Atualizar pedido (sem backlog para 'aberto')
    UPDATE pedidos_producao SET
      etapa_atual = 'aberto',
      em_backlog = FALSE,
      status = 'pendente',
      updated_at = now()
    WHERE id = p_pedido_id;

  -- =============================================
  -- CASO 2: Retornar para EM_PRODUCAO
  -- Exclui ordens posteriores, gerencia producao
  -- =============================================
  ELSIF p_etapa_destino = 'em_producao' THEN
    -- Excluir ordens de etapas posteriores
    DELETE FROM linhas_ordens 
    WHERE pedido_id = p_pedido_id AND tipo_ordem IN ('qualidade', 'pintura');
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    
    -- Processar ordens de producao conforme config
    FOR v_config IN SELECT * FROM jsonb_array_elements(p_ordens_config)
    LOOP
      v_tipo := v_config->>'tipo';
      v_acao := v_config->>'acao';
      v_justificativa := v_config->>'justificativa';
      
      IF v_acao = 'pausar' THEN
        -- Pausar ordem
        IF v_tipo = 'soldagem' THEN
          UPDATE ordens_soldagem SET status = 'pausada', pausada = true,
            justificativa_pausa = COALESCE(v_justificativa, p_motivo)
          WHERE pedido_id = p_pedido_id;
        ELSIF v_tipo = 'perfiladeira' THEN
          UPDATE ordens_perfiladeira SET status = 'pausada', pausada = true,
            justificativa_pausa = COALESCE(v_justificativa, p_motivo)
          WHERE pedido_id = p_pedido_id;
        ELSIF v_tipo = 'separacao' THEN
          UPDATE ordens_separacao SET status = 'pausada', pausada = true,
            justificativa_pausa = COALESCE(v_justificativa, p_motivo)
          WHERE pedido_id = p_pedido_id;
        END IF;
        
      ELSIF v_acao = 'reativar' THEN
        -- Reativar (resetar para pendente com backlog)
        IF v_tipo = 'soldagem' THEN
          UPDATE ordens_soldagem SET status = 'pendente', historico = false,
            em_backlog = true, data_conclusao = NULL
          WHERE pedido_id = p_pedido_id;
          UPDATE linhas_ordens SET concluida = false WHERE pedido_id = p_pedido_id AND tipo_ordem = 'soldagem';
        -- Similar para perfiladeira e separacao...
        END IF;
      END IF;
      -- 'manter' nao faz nada
    END LOOP;
    
    -- Atualizar pedido com backlog
    UPDATE pedidos_producao SET
      etapa_atual = 'em_producao',
      em_backlog = TRUE,
      updated_at = now()
    WHERE id = p_pedido_id;

  -- =============================================
  -- CASO 3: Retornar para AGUARDANDO_PINTURA
  -- Exclui instalacao, recria pintura
  -- =============================================
  ELSIF p_etapa_destino = 'aguardando_pintura' THEN
    -- Excluir ordens posteriores
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    
    -- Recriar ordem de pintura (via trigger ou funcao existente)
    -- Se nao existir, criar nova
    IF NOT EXISTS (SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
      PERFORM criar_ordem_pintura(p_pedido_id);
    ELSE
      -- Resetar ordem existente
      UPDATE ordens_pintura SET status = 'pendente', historico = false, em_backlog = true
      WHERE pedido_id = p_pedido_id;
    END IF;
    
    -- Atualizar pedido com backlog
    UPDATE pedidos_producao SET
      etapa_atual = 'aguardando_pintura',
      em_backlog = TRUE,
      updated_at = now()
    WHERE id = p_pedido_id;
  END IF;

  -- Registrar movimentacao
  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (p_pedido_id, v_etapa_atual, p_etapa_destino, p_user_id, 'backlog', p_motivo);

  -- Fechar etapa atual e abrir nova
  UPDATE pedidos_etapas SET data_saida = now()
  WHERE pedido_id = p_pedido_id AND data_saida IS NULL;
  
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (p_pedido_id, p_etapa_destino, now(), '[]'::jsonb);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

---

### Mudanca 4: Integracao na Pagina de Instalacoes

**OrdemInstalacaoRow.tsx** - Adicionar botao de retroceder:

```typescript
interface OrdemInstalacaoRowProps {
  ordem: OrdemInstalacao;
  onConcluir: (ordem: OrdemInstalacao) => void;
  onRetroceder?: (ordem: OrdemInstalacao) => void; // NOVO
  isConcluindo: boolean;
  showCarregador?: boolean;
  onClick?: (ordem: OrdemInstalacao) => void;
}

// No render, adicionar botao de retroceder ao lado do concluir:
<div className="flex items-center gap-1">
  {onRetroceder && (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); onRetroceder(ordem); }}
          className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-500/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Retroceder pedido</TooltipContent>
    </Tooltip>
  )}
  {/* Botao concluir existente */}
</div>
```

**OrdensInstalacoesLogistica.tsx** - Adicionar modal e handler:

```typescript
// Estado
const [retrocederDialog, setRetrocederDialog] = useState<{
  open: boolean;
  ordem: OrdemInstalacao | null;
}>({ open: false, ordem: null });

// Handler
const handleRetroceder = (ordem: OrdemInstalacao) => {
  setRetrocederDialog({ open: true, ordem });
};

// No render das linhas
<OrdemInstalacaoRow
  ordem={ordem}
  onConcluir={(o) => setConfirmDialog({ open: true, ordem: o })}
  onRetroceder={handleRetroceder}  // NOVO
  isConcluindo={isConcluindo}
  showCarregador={true}
  onClick={handleOpenDetalhes}
/>

// Modal no final
{retrocederDialog.ordem && retrocederDialog.ordem.pedido && (
  <RetrocederPedidoUnificadoModal
    open={retrocederDialog.open}
    onOpenChange={(open) => setRetrocederDialog({ open, ordem: null })}
    pedido={{
      id: retrocederDialog.ordem.pedido.id,
      numero_pedido: retrocederDialog.ordem.pedido.numero_pedido,
      etapa_atual: retrocederDialog.ordem.pedido.etapa_atual,
      vendas: retrocederDialog.ordem.venda
    }}
    onSuccess={() => {
      queryClient.invalidateQueries({ queryKey: ['ordens-instalacao'] });
    }}
  />
)}
```

---

### Mudanca 5: Refatorar /direcao/gestao-fabrica

Substituir o uso de `RetrocederEtapaModal` pelo novo `RetrocederPedidoUnificadoModal` para garantir consistencia:

```typescript
// No PedidoCard.tsx ou GestaoFabricaDirecao.tsx
// Substituir:
<RetrocederEtapaModal pedido={pedido} open={showRetrocederEtapa} onOpenChange={setShowRetrocederEtapa} onConfirmar={onRetrocederEtapa} />

// Por:
<RetrocederPedidoUnificadoModal
  open={showRetrocederEtapa}
  onOpenChange={setShowRetrocederEtapa}
  pedido={pedido}
  onSuccess={() => refetch()}
/>
```

---

### Resumo das Acoes por Etapa Destino

| Destino | Ordens Excluidas | Ordens Gerenciadas | Ordens Recriadas | Backlog |
|---------|------------------|--------------------|--------------------|---------|
| aberto | TODAS | - | - | NAO |
| em_producao | qualidade, pintura, instalacao, carregamento | soldagem, perfiladeira, separacao | - | SIM |
| aguardando_pintura | instalacao, carregamento | - | pintura (se nao existir) | SIM |

---

### Fluxo de Implementacao

1. **Criar hook** `useRetrocederPedido.ts`
2. **Criar migration** com funcao `retroceder_pedido_unificado`
3. **Criar componente** `RetrocederPedidoUnificadoModal.tsx`
4. **Modificar** `OrdemInstalacaoRow.tsx` (botao retroceder)
5. **Modificar** `OrdensInstalacoesLogistica.tsx` (integracao)
6. **Refatorar** `PedidoCard.tsx` (usar novo modal)
7. **Manter** `RetrocederEtapaModal.tsx` como fallback (pode ser removido futuramente)
