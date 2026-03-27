

## Plano: Melhorar aba "Arquivo Morto" na Gestão de Fábrica

### Objetivo
Adicionar filtro de intervalo de datas e substituir a listagem linear por 3 colunas categorizadas: **Instalações**, **Manutenções** e **Entregas**.

### Alterações

**1. `src/hooks/usePedidosArquivados.ts`**
- Adicionar JOIN com `vendas` para trazer `tipo_entrega`: `vendas:venda_id(tipo_entrega)`
- Adicionar parâmetros opcionais `dataInicio` e `dataFim` para filtrar por `data_arquivamento`
- Aplicar filtros `.gte()` e `.lte()` quando as datas forem fornecidas
- Exportar `tipo_entrega` no tipo `PedidoArquivado`

**2. `src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Adicionar estados para `dataInicio` e `dataFim` (DateRange picker)
- Passar datas ao hook `usePedidosArquivados`
- Na UI da aba "Arquivo Morto":
  - Adicionar filtro de datas (2 date pickers: "De" e "Até") ao lado da busca
  - Substituir a listagem única por 3 colunas lado a lado (responsivas):
    - **Instalações** (`tipo_entrega === 'instalacao'`) — ícone Wrench
    - **Manutenções** (`tipo_entrega === 'manutencao'`) — ícone Settings
    - **Entregas** (`tipo_entrega === 'entrega'` ou outros) — ícone Truck
  - Cada coluna com header, contagem e lista dos pedidos (mesmo card atual com nº pedido, cliente, data, valor, botão desarquivar)
  - No mobile: colunas empilham verticalmente

### Arquivos alterados
- `src/hooks/usePedidosArquivados.ts`
- `src/pages/direcao/GestaoFabricaDirecao.tsx`

