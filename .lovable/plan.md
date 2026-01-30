
# Plano: Corrigir Numeração das Portas na Downbar

## Problema Identificado

Na seção "Especificações da Visita Técnica" do `PedidoDetalhesSheet.tsx`, todas as portas aparecem como "Porta 1" porque estamos usando `obs.indice_porta + 1`. 

No banco de dados, cada observação tem `indice_porta: 0` porque são produtos de venda diferentes (não portas expandidas por quantidade do mesmo produto).

## Solução

1. **Usar índice do loop** (`idx + 1`) em vez de `indice_porta` para numerar as portas
2. **Buscar dimensões dos produtos** fazendo join com `produtos_vendas` para mostrar as medidas ao lado

## Alterações Técnicas

### Arquivo: `src/components/pedidos/PedidoDetalhesSheet.tsx`

**1. Modificar a query para incluir dimensões:**

```typescript
const fetchObservacoesVisita = async () => {
  try {
    const { data, error } = await supabase
      .from('pedido_porta_observacoes')
      .select(`
        *,
        produto:produtos_vendas!produto_venda_id(largura, altura, tamanho)
      `)
      .eq('pedido_id', pedido.id)
      .order('indice_porta', { ascending: true });
    
    if (!error && data) {
      setObservacoesVisita(data as ObservacaoVisita[]);
    }
  } catch (error) {
    console.error("Erro ao buscar observações:", error);
  }
};
```

**2. Atualizar interface para incluir produto:**

```typescript
interface ObservacaoVisita {
  id: string;
  produto_venda_id: string;
  indice_porta: number;
  interna_externa: string;
  lado_motor: string;
  posicao_guia: string;
  opcao_guia: string;
  aparencia_testeira: string;
  produto?: {
    largura?: number;
    altura?: number;
    tamanho?: string;
  } | null;
}
```

**3. Atualizar renderização (linha 524-526):**

Antes:
```tsx
<span className="text-xs font-medium text-amber-400 mb-2 block">
  Porta {obs.indice_porta + 1}
</span>
```

Depois:
```tsx
<span className="text-xs font-medium text-amber-400 mb-2 block">
  Porta {idx + 1}
  {obs.produto && (
    <span className="text-amber-300/70 ml-2">
      - {obs.produto.largura && obs.produto.altura 
          ? `${obs.produto.largura}m × ${obs.produto.altura}m`
          : obs.produto.tamanho || ''}
    </span>
  )}
</span>
```

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Porta 1 | Porta 1 - 3.00m × 4.00m |
| Porta 1 | Porta 2 - 2.50m × 3.00m |
| Porta 1 | Porta 3 - 3.00m × 4.00m |
| Porta 1 | Porta 4 - 2.00m × 2.50m |
