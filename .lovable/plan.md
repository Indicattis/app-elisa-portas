

## Plano: Corrigir Função concluir_carregamento_instalacao

### Problema Identificado

A função `concluir_carregamento_instalacao` (linha 30-31) insere em `pedidos_movimentacoes` sem fornecer a coluna obrigatória `etapa_destino`:

```sql
-- Código atual (incorreto - linha 30-31):
INSERT INTO pedidos_movimentacoes (pedido_id, user_id, teor, descricao)
VALUES (v_pedido_id, auth.uid(), 'carregamento', 'Carregamento da instalação concluído');
```

A coluna `etapa_destino` é `NOT NULL`, causando o erro.

### Lógica de Negócio Confirmada

- O carregamento da instalação **NÃO** muda a etapa do pedido
- O pedido **permanece** em "instalacoes" após o carregamento
- A instalação só é finalizada quando o usuário **explicitamente** conclui a ordem
- Portanto: `etapa_origem = 'instalacoes'` e `etapa_destino = 'instalacoes'` (mesma etapa)

---

### Arquivo a Criar

| Tipo | Descrição |
|------|-----------|
| Migration SQL | Corrigir função para incluir etapa_origem e etapa_destino |

---

### SQL para Corrigir

```sql
CREATE OR REPLACE FUNCTION public.concluir_carregamento_instalacao(p_instalacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_etapa_atual text;
BEGIN
  -- Buscar pedido_id e etapa atual da instalação
  SELECT i.pedido_id, pp.etapa_atual 
  INTO v_pedido_id, v_etapa_atual
  FROM instalacoes i
  LEFT JOIN pedidos_producao pp ON pp.id = i.pedido_id
  WHERE i.id = p_instalacao_id;

  -- Marcar carregamento como concluído na tabela instalacoes
  -- O pedido permanece em 'instalacoes' para finalização manual
  UPDATE instalacoes
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = auth.uid(),
      updated_at = now()
  WHERE id = p_instalacao_id;
  
  -- Registrar movimentação COM etapa_destino (obrigatório)
  -- O pedido permanece na mesma etapa (não avança)
  IF v_pedido_id IS NOT NULL THEN
    INSERT INTO pedidos_movimentacoes (
      pedido_id, 
      user_id, 
      etapa_origem, 
      etapa_destino,
      teor, 
      descricao
    )
    VALUES (
      v_pedido_id, 
      auth.uid(), 
      COALESCE(v_etapa_atual, 'instalacoes'),
      COALESCE(v_etapa_atual, 'instalacoes'),  -- Permanece na mesma etapa
      'carregamento', 
      'Carregamento da instalação concluído'
    );
  END IF;
END;
$$;
```

---

### Mudanças Chave

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Busca etapa_atual | Não | Sim (via JOIN com pedidos_producao) |
| etapa_origem | Não fornecido | COALESCE(v_etapa_atual, 'instalacoes') |
| etapa_destino | Não fornecido (ERRO!) | COALESCE(v_etapa_atual, 'instalacoes') |
| Avanço de etapa | Não | Não (permanece igual) |

---

### Fluxo de Negócio Preservado

```
┌─────────────────────────────────────────────────────────────┐
│ CARREGAMENTO DE INSTALAÇÃO                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuário conclui carregamento em /producao/carregamento   │
│ 2. Função marca carregamento_concluido = true               │
│ 3. Registra movimentação: instalacoes → instalacoes         │
│    (apenas registro, não avança etapa)                      │
│ 4. Instalação para de aparecer no carregamento              │
│ 5. Instalação continua visível em /logistica/instalacoes    │
│ 6. Usuário conclui manualmente → avança para Finalizado     │
└─────────────────────────────────────────────────────────────┘
```

---

### Resultado Esperado

1. Erro de constraint NOT NULL será resolvido
2. Movimentação de carregamento será registrada corretamente
3. Pedido permanecerá em "instalacoes" aguardando conclusão manual
4. Instalação desaparecerá de `/producao/carregamento` após conclusão

