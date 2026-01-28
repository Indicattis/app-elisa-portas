

## Plano: Alinhar Linhas Lateralmente e Botao de Regenerar

### Objetivo

1. Redesenhar as linhas na sidebar `OrdemLinhasSheet` com alinhamento lateral (grid horizontal)
2. Adicionar botao para regenerar as linhas da ordem

---

### Mudanca 1: Layout Lateral das Linhas

**Arquivo:** `src/components/fabrica/OrdemLinhasSheet.tsx`

Substituir o layout de cards verticais por linhas horizontais de altura fixa (32px):

```text
Antes:
+--------------------------------+
|  [ ] Nome do Produto           |
|      Qtd: 5  |  Tam: 2.5m      |
+--------------------------------+

Depois:
| [ ] | Nome do Produto      | Qtd | Tam    | Dims      |
|-----|----------------------|-----|--------|-----------|
| [x] | Porta de Enrolar     | 2   | 3.5m   | 3000x2500 |
| [ ] | Guia Lateral         | 4   | 2.8m   | -         |
```

**Grid template:**
```
grid-template-columns: 24px 1fr 50px 60px 90px
```

**Colunas:**
1. Checkbox (24px)
2. Nome do produto (flex)
3. Quantidade (50px)
4. Tamanho (60px)
5. Dimensoes largura x altura (90px)

---

### Mudanca 2: Botao Regenerar Linhas

**Arquivo:** `src/components/fabrica/OrdemLinhasSheet.tsx`

Adicionar botao no header da Sheet:

```typescript
<SheetHeader>
  <SheetTitle className="flex items-center gap-2">
    <Package className="w-5 h-5 text-blue-400" />
    <span className="flex-1">...</span>
    
    {/* NOVO: Botao regenerar */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleRegenerarLinhas}
          disabled={isRegenerando}
          className="h-7 w-7"
        >
          {isRegenerando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 text-amber-400" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Regenerar linhas da ordem</TooltipContent>
    </Tooltip>
    
    {/* Avatar responsavel existente */}
  </SheetTitle>
</SheetHeader>
```

---

### Mudanca 3: RPC para Regenerar Linhas

**Arquivo:** Nova migration SQL

Criar funcao que regenera linhas de uma ordem especifica:

```sql
CREATE OR REPLACE FUNCTION public.regenerar_linhas_ordem(
  p_ordem_id UUID,
  p_tipo_ordem TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id UUID;
  v_linha RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Buscar pedido_id da ordem
  CASE p_tipo_ordem
    WHEN 'soldagem' THEN
      SELECT pedido_id INTO v_pedido_id FROM ordens_soldagem WHERE id = p_ordem_id;
    WHEN 'perfiladeira' THEN
      SELECT pedido_id INTO v_pedido_id FROM ordens_perfiladeira WHERE id = p_ordem_id;
    WHEN 'separacao' THEN
      SELECT pedido_id INTO v_pedido_id FROM ordens_separacao WHERE id = p_ordem_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Tipo de ordem invalido');
  END CASE;

  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ordem nao encontrada');
  END IF;

  -- Excluir linhas atuais da ordem
  DELETE FROM linhas_ordens 
  WHERE ordem_id = p_ordem_id AND tipo_ordem = p_tipo_ordem;

  -- Recriar linhas a partir de pedido_linhas
  FOR v_linha IN
    SELECT 
      pl.id as pedido_linha_id,
      pl.quantidade,
      pl.estoque_id,
      COALESCE(e.nome_produto, pl.nome_produto) as nome_produto_final,
      pv.tamanho,
      pv.largura,
      pv.altura,
      pv.tipo_pintura,
      cc.nome as cor_nome,
      pl.produto_venda_id
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    LEFT JOIN produtos_vendas pv ON pl.produto_venda_id = pv.id
    LEFT JOIN catalogo_cores cc ON pv.cor_id = cc.id
    WHERE pl.pedido_id = v_pedido_id
      AND COALESCE(
        e.setor_responsavel_producao::text,
        CASE pl.categoria_linha
          WHEN 'solda' THEN 'soldagem'
          WHEN 'perfiladeira' THEN 'perfiladeira'
          WHEN 'separacao' THEN 'separacao'
          ELSE NULL
        END
      ) = p_tipo_ordem
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      pedido_linha_id,
      estoque_id,
      produto_venda_id,
      item,
      quantidade,
      tamanho,
      largura,
      altura,
      tipo_pintura,
      cor_nome,
      concluida
    )
    VALUES (
      v_pedido_id,
      p_ordem_id,
      p_tipo_ordem,
      v_linha.pedido_linha_id,
      v_linha.estoque_id,
      v_linha.produto_venda_id,
      COALESCE(v_linha.nome_produto_final, 'Item'),
      v_linha.quantidade,
      v_linha.tamanho,
      v_linha.largura,
      v_linha.altura,
      v_linha.tipo_pintura,
      v_linha.cor_nome,
      false
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'linhas_criadas', v_count);
END;
$$;
```

---

### Mudanca 4: Mutation para Regenerar

**Arquivo:** `src/components/fabrica/OrdemLinhasSheet.tsx`

```typescript
const regenerarLinhas = useMutation({
  mutationFn: async () => {
    if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem invalida');
    
    const { data, error } = await supabase.rpc('regenerar_linhas_ordem', {
      p_ordem_id: ordem.id,
      p_tipo_ordem: ordem.tipo,
    });
    
    if (error) throw error;
    if (data && !data.success) throw new Error(data.error);
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
    toast({
      title: "Linhas regeneradas",
      description: `${data.linhas_criadas} linhas foram recriadas.`,
    });
  },
  onError: (error) => {
    toast({
      title: "Erro",
      description: "Nao foi possivel regenerar as linhas.",
      variant: "destructive",
    });
  },
});
```

---

### Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Modificar | Layout lateral + botao regenerar |
| `supabase/migrations/xxx.sql` | Criar | Funcao RPC `regenerar_linhas_ordem` |
| `src/integrations/supabase/types.ts` | Atualizar | Tipagem da nova RPC |

---

### Visual Final da Sidebar

```text
+------------------------------------------+
|  [Package] Soldagem #S-0123   [R] [Av]   |
|  Responsavel: Joao                       |
|  Progresso: 2/5 linhas   [40%]           |
+------------------------------------------+
|                                          |
|  [ ] | Porta de Enrolar    | 2 | 3.5m | 3000x2500 |
|  [x] | Guia Lateral        | 4 | 2.8m | -         |
|  [ ] | Eixo Acionamento    | 2 | -    | -         |
|  [x] | Mola Balanceamento  | 8 | 1.2m | -         |
|  [ ] | Suporte Lateral     | 4 | -    | -         |
|                                          |
+------------------------------------------+

Legenda:
[R] = Botao Regenerar (RefreshCw icon)
[Av] = Avatar do responsavel
[x] = Checkbox marcado
```

---

### Detalhes de Estilizacao

**Linha concluida:**
- Background: `bg-green-500/10`
- Border: `border-green-500/30`
- Texto: `text-green-300 line-through`

**Linha pendente:**
- Background: `bg-zinc-800/30`
- Border: `border-zinc-700/30`
- Texto: `text-white`

**Header das colunas (opcional):**
```typescript
<div className="grid gap-2 px-2 py-1 text-[10px] text-zinc-500 border-b border-zinc-700/30"
     style={{ gridTemplateColumns: '24px 1fr 50px 60px 90px' }}>
  <span></span>
  <span>Item</span>
  <span>Qtd</span>
  <span>Tam</span>
  <span>Dims</span>
</div>
```

