

## Plano: Enriquecer aba "Pendente Faturamento" com dados e funcionalidades dos pedidos

### Resumo
Adicionar ao card e hook de vendas pendentes: filtro por ano atual, tempo pendente, forma de pagamento, cores dos produtos, tipo de entrega (instalação/entrega), localização (cidade/estado), e drag-and-drop para reordenação.

### Mudanças

**1. `src/hooks/useVendasPendentePedido.ts`**
- Adicionar filtro `.gte("data_venda", "2026-01-01")` para trazer somente vendas do ano atual
- Expandir select para incluir: `tipo_entrega`, `metodo_pagamento`, `cidade`, `estado`, `created_at`
- Expandir select de `produtos_vendas` para incluir: `cor:catalogo_cores(nome, codigo_hex)`, `valor_pintura`
- Atualizar interface `VendaPendentePedido` com novos campos: `tipo_entrega`, `metodo_pagamento`, `cidade`, `estado`, `cores` (array de {nome, codigo_hex}), `data_faturamento` (usar data_venda como referência de tempo pendente)
- Mapear cores únicas dos produtos no `.map()`

**2. `src/components/pedidos/VendaPendentePedidoCard.tsx`**
- Expandir grid para incluir novas colunas: tempo pendente | forma pagamento | tipo entrega (badge Hammer/Truck) | cores (círculos coloridos) | cidade/estado
- Adicionar prop `dragHandleProps` opcional para suportar drag-and-drop (ícone GripVertical)
- Calcular tempo pendente com `differenceInDays` do date-fns
- Badge de tipo entrega: azul com Hammer para instalação, verde com Truck para entrega
- Cores: círculos coloridos como no PedidoCard (até 2 cores com pill shape)
- Localização: texto `cidade/estado` como no PedidoCard
- Grid atualizado: `20px 24px 1fr 70px 50px 30px 80px 70px 100px 20px` (grip | avatar | nome | cidade | tempo | entrega | cores | pagamento | valor | seta)

**3. `src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Implementar drag-and-drop na aba pendente_pedido usando `DndContext` + `SortableContext` similar ao `PedidosDraggableList`
- Adicionar state para ordem das vendas pendentes
- Adicionar mutation para salvar prioridade (pode usar localStorage ou campo na tabela vendas)
- Envolver cards em SortableContext com verticalListSortingStrategy

### Arquivos alterados
- `src/hooks/useVendasPendentePedido.ts`
- `src/components/pedidos/VendaPendentePedidoCard.tsx`
- `src/pages/direcao/GestaoFabricaDirecao.tsx`

