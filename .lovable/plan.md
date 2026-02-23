

# Adicionar coluna de selecao na tabela de faturamento

## Objetivo

Adicionar uma coluna visual de selecao na tabela para que o usuario identifique qual venda esta selecionada e cujos dados estao sendo exibidos na sidebar direita.

## Mudancas no arquivo `src/pages/direcao/FaturamentoDirecao.tsx`

### 1. Adicionar destaque visual na linha selecionada

Alterar o `TableRow` (linha ~1116) para aplicar uma classe de fundo diferenciada quando `venda.id === selectedVenda?.id`:

```typescript
<TableRow 
  key={venda.id} 
  className={cn(
    "border-white/10 hover:bg-white/5 cursor-pointer",
    selectedVenda?.id === venda.id && "bg-blue-500/10 border-l-2 border-l-blue-500"
  )}
  onClick={() => setSelectedVenda(venda)}
>
```

### 2. Adicionar coluna de selecao com indicador visual

Adicionar um `TableHead` fixo antes das colunas dinamicas no header (linha ~1092):

```typescript
<TableHead className="w-8 text-center text-white/60" />
```

E um `TableCell` correspondente no body com um radio/dot indicator:

```typescript
<TableCell className="w-8 text-center">
  <div className={cn(
    "h-3 w-3 rounded-full border-2 mx-auto transition-colors",
    selectedVenda?.id === venda.id 
      ? "bg-blue-500 border-blue-500" 
      : "border-white/20"
  )} />
</TableCell>
```

### 3. Ajustar o colSpan da mensagem "Nenhuma venda encontrada"

Alterar o colSpan (linha ~1110) de `visibleColumns.length` para `visibleColumns.length + 1` para acomodar a nova coluna.

