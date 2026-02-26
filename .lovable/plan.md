

# Editar parcelas: quantidade, status inline e melhorias

## Mudancas

### 1. Botoes para adicionar/remover parcelas

Na secao "Parcelas / Contas a Receber", adicionar botoes no header do card:
- **"+ Parcela"**: insere uma nova parcela na tabela `contas_receber` com o `venda_id` atual, `metodo_pagamento` do primeiro grupo existente, `valor_parcela` = 0, `data_vencimento` = hoje, `status` = 'pendente', e `numero_parcela` = proximo numero sequencial
- **"Remover ultima"** (icone lixeira): remove a ultima parcela pendente (nao permite remover parcelas pagas). Exibe confirmacao antes de deletar

Ambas as operacoes fazem insert/delete no Supabase e atualizam o estado local `contasReceber`.

### 2. Toggle de status direto na tag Pago/Pendente

Substituir a tag estatica de status (canto superior direito de cada card de parcela) por um botao clicavel que alterna entre Pago e Pendente:
- Ao clicar, chama `handleUpdatePagamento(parcela.id, 'status', novoStatus)`
- Manter o mesmo estilo visual (badge verde para Pago, amarelo para Pendente) mas com `cursor-pointer` e hover
- Remover os botoes grandes "Marcar como Pago" / "Marcar como Nao Pago" que existem no rodape de cada card, ja que a funcionalidade migra para a tag

### Detalhes tecnicos

**Adicionar parcela:**
```typescript
const handleAddParcela = async () => {
  const maxNumero = Math.max(0, ...contasReceber.map(p => p.numero_parcela || 0));
  const metodo = contasReceber[0]?.metodo_pagamento || 'boleto';
  const { data, error } = await supabase
    .from('contas_receber')
    .insert({
      venda_id: id,
      metodo_pagamento: metodo,
      valor_parcela: 0,
      data_vencimento: new Date().toISOString().split('T')[0],
      status: 'pendente',
      numero_parcela: maxNumero + 1,
    })
    .select()
    .single();
  // atualiza estado local
};
```

**Remover parcela:**
```typescript
const handleRemoveParcela = async (parcelaId: string) => {
  await supabase.from('contas_receber').delete().eq('id', parcelaId);
  // atualiza estado local
};
```

**Tag clicavel (substitui badge + botoes de rodape):**
```tsx
<button
  onClick={() => handleUpdatePagamento(parcela.id, 'status', isPago ? 'pendente' : 'pago')}
  className={cn(
    "text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors",
    isPago ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
           : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
  )}
>
  {isPago ? 'Pago' : 'Pendente'}
</button>
```

**Imports adicionais:** `Trash2` do lucide-react

**Arquivo editado:** `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

