

## Plano: Corrigir Valor de Teor na Função concluir_carregamento_instalacao

### Problema Identificado

A função `concluir_carregamento_instalacao` usa o valor `'carregamento'` para a coluna `teor`, mas este valor não é permitido pelo check constraint.

**Constraint atual:**
```sql
CHECK ((teor = ANY (ARRAY['avanco'::text, 'backlog'::text, 'reorganizacao'::text, 'criacao'::text])))
```

**Valores permitidos:**
| Valor | Descrição |
|-------|-----------|
| avanco | Avanço de etapa |
| backlog | Retrocesso de etapa |
| reorganizacao | Reorganização/reordenamento |
| criacao | Criação do pedido |

### Solução

Temos duas opções:

**Opção 1 (Recomendada):** Remover a inserção de movimentação, já que o carregamento não muda a etapa do pedido

**Opção 2:** Adicionar `'carregamento'` aos valores permitidos no constraint

Recomendo a **Opção 1** porque:
- O carregamento não é uma movimentação de etapa (origem = destino)
- O registro de carregamento já existe na tabela `instalacoes` (`carregamento_concluido`, `carregamento_concluido_em`)
- Manter o constraint simples evita confusão sobre o que é uma "movimentação"

---

### Arquivo a Modificar

| Tipo | Descrição |
|------|-----------|
| Migration SQL | Remover INSERT em pedidos_movimentacoes da função |

---

### SQL para Corrigir (Opção 1)

```sql
CREATE OR REPLACE FUNCTION public.concluir_carregamento_instalacao(p_instalacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar carregamento como concluído na tabela instalacoes
  -- O pedido permanece em 'instalacoes' para finalização manual
  -- NÃO registra movimentação pois não há mudança de etapa
  UPDATE instalacoes
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = auth.uid(),
      updated_at = now()
  WHERE id = p_instalacao_id;
END;
$$;
```

---

### Alternativa: SQL para Corrigir (Opção 2 - Expandir Constraint)

Se preferir manter o registro de movimentação:

```sql
-- Primeiro, remover o constraint antigo
ALTER TABLE pedidos_movimentacoes 
DROP CONSTRAINT pedidos_movimentacoes_teor_check;

-- Adicionar novo constraint com 'carregamento' incluído
ALTER TABLE pedidos_movimentacoes 
ADD CONSTRAINT pedidos_movimentacoes_teor_check 
CHECK (teor = ANY (ARRAY['avanco', 'backlog', 'reorganizacao', 'criacao', 'carregamento']));
```

---

### Mudança Chave

```text
OPÇÃO 1 (Simplificar):
┌─────────────────────────────────────────────────────────────┐
│ FUNÇÃO concluir_carregamento_instalacao                     │
├─────────────────────────────────────────────────────────────┤
│ ANTES:                                                      │
│   1. UPDATE instalacoes SET carregamento_concluido = true   │
│   2. INSERT INTO pedidos_movimentacoes (teor='carregamento')│
│      ↑ ERRO: valor não permitido                            │
│                                                             │
│ DEPOIS:                                                     │
│   1. UPDATE instalacoes SET carregamento_concluido = true   │
│      ↑ Apenas isso - registro já existe na tabela           │
└─────────────────────────────────────────────────────────────┘

OPÇÃO 2 (Expandir):
┌─────────────────────────────────────────────────────────────┐
│ CONSTRAINT pedidos_movimentacoes_teor_check                 │
├─────────────────────────────────────────────────────────────┤
│ ANTES: ['avanco', 'backlog', 'reorganizacao', 'criacao']    │
│ DEPOIS: + 'carregamento'                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Seção Técnica

**Por que Opção 1 é recomendada:**
1. A tabela `instalacoes` já registra quando o carregamento foi concluído (`carregamento_concluido_em`, `carregamento_concluido_por`)
2. `pedidos_movimentacoes` é para registrar **mudanças de etapa**, não atividades internas
3. Menos dados redundantes = menos chances de inconsistência
4. Os logs em `/admin/logs` podem buscar de `instalacoes` para eventos de carregamento

---

### Resultado Esperado

1. Conclusão de carregamento funcionará sem erro
2. Registro de quem/quando concluiu fica em `instalacoes`
3. Logs podem ser ajustados para incluir eventos de carregamento da tabela `instalacoes`

