

# Melhorias na página /direcao/dre/custos

## Alterações em `src/pages/direcao/DREDespesasDirecao.tsx` → na verdade `src/pages/direcao/DRECustosDirecao.tsx`

### 1. Buscar `quantidade` junto com os demais campos
Adicionar `quantidade` ao select e à interface `EstoqueItem`.

### 2. Unidade editável (inline, como o custo)
Adicionar estado para edição de unidade. Ao clicar na célula de unidade, abre um input text inline com os mesmos controles (Enter salva, Escape cancela). Salva via `supabase.from("estoque").update({ unidade })`.

Usar um estado separado `editingField` para distinguir se está editando `custo` ou `unidade`, evitando conflito.

### 3. Coluna "Custo Total"
Nova coluna `Custo Total = quantidade × custo_unitario`, exibida com `formatCurrency`.

### 4. Coluna de índice (#)
Primeira coluna com número sequencial (1, 2, 3...).

### 5. Linha de totais (footer)
Linha no final da tabela com:
- **Custo Total**: soma de todos os `quantidade × custo_unitario` dos itens filtrados

### Estrutura da tabela final

```text
#  | Nome | Categoria | Unidade | Custo Unitário | Custo Total
1  | ...  | ...       | UN (ed) | R$ ... (ed)    | R$ ...
...
   |      |           |         | TOTAL          | R$ XXX
```

### Arquivo alterado
- `src/pages/direcao/DRECustosDirecao.tsx`

