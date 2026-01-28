

## Plano: Sistema de Retorno para Produção com Exclusão de Ordens e Status Configurável

### Contexto do Problema

O pedido `537c9681-7b96-4477-9897-81a4bf3d38e4` foi retornado para produção, mas:
1. **Ordem de qualidade** (`OQU-2026-0007`) ainda existe - deveria ser excluída
2. **Ordem de pintura** (`PINT-00058`) ainda existe - deveria ser excluída
3. Linhas associadas a ambas as ordens também permaneceram

Além disso, o usuário deseja um modal melhorado onde possa definir o status de cada ordem de produção (pausada com justificativa, ou pendente).

---

### Parte 1: Corrigir Dados do Pedido Atual

**Ação Imediata:** Executar SQL para limpar os dados órfãos do pedido específico:

```sql
-- Excluir linhas de qualidade e pintura
DELETE FROM linhas_ordens 
WHERE pedido_id = '537c9681-7b96-4477-9897-81a4bf3d38e4' 
  AND tipo_ordem IN ('qualidade', 'pintura');

-- Excluir ordem de qualidade
DELETE FROM ordens_qualidade 
WHERE pedido_id = '537c9681-7b96-4477-9897-81a4bf3d38e4';

-- Excluir ordem de pintura  
DELETE FROM ordens_pintura 
WHERE pedido_id = '537c9681-7b96-4477-9897-81a4bf3d38e4';
```

---

### Parte 2: Atualizar Função SQL de Retorno

**Arquivo:** `supabase/migrations/[nova_migracao].sql`

**Mudanças na função `retornar_pedido_para_producao`:**

1. Adicionar parâmetro para status das ordens (array de objetos JSONB)
2. Excluir ordem de pintura e suas linhas
3. Excluir ordem de qualidade e suas linhas
4. Aplicar status configurado para cada ordem (pendente ou pausada com justificativa)

**Nova assinatura:**
```sql
CREATE OR REPLACE FUNCTION retornar_pedido_para_producao(
  p_pedido_id UUID,
  p_ordem_qualidade_id UUID,
  p_motivo TEXT,
  p_ordens_config JSONB,  -- [{tipo: 'soldagem', acao: 'pausar', justificativa: '...'}, ...]
  p_user_id UUID
)
```

**Estrutura do `p_ordens_config`:**
```json
[
  {"tipo": "soldagem", "acao": "pausar", "justificativa": "Refazer solda do eixo"},
  {"tipo": "perfiladeira", "acao": "reativar"},
  {"tipo": "separacao", "acao": "manter"}  
]
```

Onde `acao` pode ser:
- `pausar`: Define status = 'pausada', pausada = true, justificativa_pausa = texto
- `reativar`: Define status = 'pendente', limpa responsável e pausa
- `manter`: Não altera a ordem (mantém status atual)

---

### Parte 3: Redesenhar Modal de Retorno

**Arquivo:** `src/components/production/RetornarProducaoModal.tsx`

**Novo layout do modal:**

```text
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Retornar Pedido para Produção                            │
├─────────────────────────────────────────────────────────────┤
│ Pedido: #0097/25                                            │
│ Cliente: FERNANDO FIGUEIRO LTDA                             │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Esta ação irá:                                           │
│ • Excluir ordem de qualidade e pintura (serão recriadas)    │
│ • Retornar pedido para etapa "Em Produção"                  │
│ • Marcar como BACKLOG                                       │
├─────────────────────────────────────────────────────────────┤
│ 📋 Justificativa Geral: *                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Problemas na soldagem...                                │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Defina o que fazer com cada ordem:                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔧 Soldagem (OS-2025-0013) - Status: Concluído          │ │
│ │ ┌──────────────────────────────────────────────────┐    │ │
│ │ │ ○ Manter status atual                            │    │ │
│ │ │ ● Pausar ordem (definir justificativa)           │    │ │
│ │ │ ○ Reativar ordem (pendente, a fazer)             │    │ │
│ │ └──────────────────────────────────────────────────┘    │ │
│ │ Justificativa da pausa:                                 │ │
│ │ ┌─────────────────────────────────────────────────┐     │ │
│ │ │ Refazer solda do eixo principal...              │     │ │
│ │ └─────────────────────────────────────────────────┘     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏭 Perfiladeira (OP-2025-0015) - Status: Concluído      │ │
│ │ ┌──────────────────────────────────────────────────┐    │ │
│ │ │ ● Manter status atual                            │    │ │
│ │ │ ○ Pausar ordem                                   │    │ │
│ │ │ ○ Reativar ordem                                 │    │ │
│ │ └──────────────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📦 Separação (OE-2025-0014) - Status: Concluído         │ │
│ │ ┌──────────────────────────────────────────────────┐    │ │
│ │ │ ● Manter status atual                            │    │ │
│ │ │ ○ Pausar ordem                                   │    │ │
│ │ │ ○ Reativar ordem                                 │    │ │
│ │ └──────────────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                          [Cancelar]  [Confirmar Retorno]    │
└─────────────────────────────────────────────────────────────┘
```

---

### Parte 4: Atualizar Hook

**Arquivo:** `src/hooks/useRetornarProducao.ts`

**Mudanças:**
1. Atualizar interface para incluir configuração por ordem
2. Enviar JSONB para a função RPC

```typescript
interface OrdemConfig {
  tipo: 'soldagem' | 'perfiladeira' | 'separacao';
  acao: 'manter' | 'pausar' | 'reativar';
  justificativa?: string;
}

interface RetornarProducaoParams {
  pedidoId: string;
  ordemQualidadeId: string;
  motivo: string;
  ordensConfig: OrdemConfig[];
}
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Nova migração SQL | Criar | SQL para limpar dados do pedido específico |
| Nova migração SQL | Criar | Atualizar função `retornar_pedido_para_producao` |
| `src/hooks/useRetornarProducao.ts` | Modificar | Atualizar interface e chamada RPC |
| `src/components/production/RetornarProducaoModal.tsx` | Modificar | Novo layout com RadioGroup por ordem |

---

### Detalhes Técnicos

**Nova função SQL:**

```sql
CREATE OR REPLACE FUNCTION retornar_pedido_para_producao(
  p_pedido_id UUID,
  p_ordem_qualidade_id UUID,
  p_motivo TEXT,
  p_ordens_config JSONB,
  p_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
  v_tipo TEXT;
  v_acao TEXT;
  v_justificativa TEXT;
BEGIN
  -- Validações
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;

  -- 1. EXCLUIR ORDEM DE QUALIDADE E SUAS LINHAS
  DELETE FROM linhas_ordens 
  WHERE pedido_id = p_pedido_id AND tipo_ordem = 'qualidade';
  
  DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;

  -- 2. EXCLUIR ORDEM DE PINTURA E SUAS LINHAS
  DELETE FROM linhas_ordens 
  WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
  
  DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;

  -- 3. PROCESSAR CADA ORDEM DE PRODUÇÃO
  FOR v_config IN SELECT * FROM jsonb_array_elements(p_ordens_config)
  LOOP
    v_tipo := v_config->>'tipo';
    v_acao := v_config->>'acao';
    v_justificativa := v_config->>'justificativa';

    -- Processar conforme a ação
    IF v_acao = 'pausar' THEN
      -- Pausar ordem com justificativa
      IF v_tipo = 'soldagem' THEN
        UPDATE ordens_soldagem 
        SET status = 'pausada',
            pausada = true,
            pausada_em = now(),
            justificativa_pausa = v_justificativa,
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
      ELSIF v_tipo = 'perfiladeira' THEN
        UPDATE ordens_perfiladeira 
        SET status = 'pausada',
            pausada = true,
            pausada_em = now(),
            justificativa_pausa = v_justificativa,
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
      ELSIF v_tipo = 'separacao' THEN
        UPDATE ordens_separacao 
        SET status = 'pausada',
            pausada = true,
            pausada_em = now(),
            justificativa_pausa = v_justificativa,
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
      END IF;

    ELSIF v_acao = 'reativar' THEN
      -- Reativar ordem como pendente
      IF v_tipo = 'soldagem' THEN
        UPDATE ordens_soldagem 
        SET status = 'pendente',
            historico = false,
            em_backlog = true,
            pausada = false,
            pausada_em = NULL,
            justificativa_pausa = NULL,
            responsavel_id = NULL,
            data_conclusao = NULL,
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
        
        UPDATE linhas_ordens 
        SET concluida = false, concluida_em = NULL, concluida_por = NULL
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'soldagem';
        
      -- Similar para perfiladeira e separacao...
      END IF;
    END IF;
    -- 'manter' não faz nada
  END LOOP;

  -- 4. ATUALIZAR ETAPAS
  UPDATE pedidos_etapas 
  SET data_saida = now()
  WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;

  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (p_pedido_id, 'em_producao', now(), '[]'::jsonb);

  -- 5. ATUALIZAR PEDIDO
  UPDATE pedidos_producao 
  SET etapa_atual = 'em_producao',
      em_backlog = true,
      observacoes = COALESCE(observacoes, '') || 
        E'\n\n[RETORNO QUALIDADE ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ']: ' || p_motivo,
      updated_at = now()
  WHERE id = p_pedido_id;
END;
$$;
```

---

### Resultado Esperado

1. **Pedido atual corrigido**: Ordens de qualidade e pintura serão excluídas
2. **Futuras operações de retorno**:
   - Sempre excluem ordens de qualidade e pintura (serão recriadas ao avançar)
   - Usuário define ação para cada ordem de produção (manter/pausar/reativar)
   - Ordens pausadas recebem justificativa específica
   - Ordens reativadas voltam para o backlog com linhas desmarcadas

