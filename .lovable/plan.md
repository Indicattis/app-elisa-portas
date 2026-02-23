

# Adicionar Busca e Intervalo de Datas acima da Tabela

## Resumo

Adicionar uma barra acima da tabela com um input de busca (por nome do cliente) e um botao de intervalo de datas (com Popover + dois Calendarios para data inicial e final).

## Mudancas

**Arquivo:** `src/pages/administrativo/ContasReceberMinimalista.tsx`

### Novos states
- `searchText: string` - texto de busca
- `dateRange: { from: Date | undefined; to: Date | undefined }` - intervalo de datas selecionado

### Barra acima da tabela
Inserir entre o `<main>` e o container da tabela um `div` com:
- Input com icone de lupa, placeholder "Buscar por cliente...", filtrando pelo campo `venda.cliente_nome`
- Botao com icone de calendario que abre Popover com dois calendarios (Data Inicial e Data Final), com botao para limpar as datas

### Filtro adicional na logica de filtragem
- Filtrar `contasFiltradas` pelo `searchText` comparando com `cliente_nome` (case-insensitive)
- Filtrar pelo intervalo de datas comparando `data_vencimento` com `dateRange.from` e `dateRange.to`

### Layout
```text
+---------------------------------------+
| [🔍 Buscar por cliente...] [📅 Datas] |
+---------------------------------------+
| Tabela ...                            |
+---------------------------------------+
```

O input ocupa a maior parte da largura e o botao de datas fica ao lado, ambos com altura consistente.

