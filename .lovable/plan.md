# Relatório de Materiais Pendentes por Etapa de Produção

## O que será feito

Em `/administrativo/pedidos`, adicionar uma nova seção (ou dialog) que permite gerar um relatório de materiais pendentes, com fluxo em duas etapas:

1. **Buscar clientes com materiais pendentes** — usuário escolhe a(s) etapa(s) de produção, clica em "Buscar Clientes com Materiais Pendentes"; o sistema lista apenas pedidos cujas linhas têm material vinculado e estoque insuficiente.
2. **Selecionar pedidos/clientes** — checkboxes por pedido (com seletor "Marcar todos").
3. **Gerar relatório de materiais** — calcula consolidado de itens faltantes para os pedidos selecionados, exibindo:
   - Nome do material
   - Quantidade total necessária
   - Metragem total necessária
   - Estoque atual
   - Faltante (necessário − estoque)

## Fluxo da UI

```text
[Botão "Relatório de Materiais Pendentes"] (no header da página)
        ↓
Dialog/Sheet:
  1. Filtro de Etapas (multi-select: Aberto, Em Produção, Pintura, Embalagem, etc.)
  2. [Buscar Clientes com Materiais Pendentes]
        ↓
  3. Lista de pedidos com checkboxes
     [✓ Marcar todos]
     [✓] Pedido #123 - Cliente X (3 materiais faltando)
     [✓] Pedido #456 - Cliente Y (1 material faltando)
        ↓
  4. [Gerar Relatório de Materiais]
        ↓
  5. Tabela consolidada:
     Material | Qtd. Total | Metragem Total | Estoque | Faltante
     Botão [Exportar PDF] (opcional, usar utilitário existente)
```

## Mudanças técnicas

### Novo hook `useMateriaisPendentesPorEtapa.ts`
- Aceita filtro de etapas (array de `EtapaPedido`).
- Disparado manualmente via `enabled: false` + `refetch()` (ou estado local que controla `enabled`).
- Query:
  1. Buscar `pedidos_producao` filtrando por `etapa_atual IN (etapas selecionadas)`.
  2. Buscar `pedido_linhas` desses pedidos com `estoque_id NOT NULL`, juntando `estoque` (nome, unidade, quantidade atual).
  3. Buscar dados do cliente via `vendas` (cliente_nome, numero_pedido).
  4. Agrupar por pedido: identificar quais materiais têm necessidade > estoque (pendente).
- Retorna: `pedidosComPendencias: { pedido_id, numero_pedido, cliente_nome, etapa, materiaisPendentes: MaterialPendente[] }[]`

### Novo hook `useRelatorioMateriaisConsolidado.ts`
- Recebe array de `pedido_id` selecionados.
- Reaproveita a lógica de agregação de `useMateriaisNecessariosProducao`: quantidade total e metragem total (largura×altura ou tamanho × quantidade) por material.
- Compara com estoque atual e calcula `faltante`.
- Retorna lista consolidada ordenada pelo maior faltante.

### Novo componente `RelatorioMateriaisPendentesDialog.tsx`
- Dialog/Sheet com 3 estados: filtro inicial → seleção de pedidos → relatório consolidado.
- Botão "Voltar" entre os passos.
- Exportação para PDF usando `jsPDF` (mesmo padrão de `src/utils/estoquePDFGenerator.ts`).

### Página `PedidosAdminMinimalista.tsx`
- Adicionar botão "Materiais Pendentes" no `headerActions` ao lado do refresh, com ícone `ClipboardList`.
- Abre o dialog acima.

## Estética
- Glassmorphism unificado: `bg-white/5`, `backdrop-blur-xl`, `border-white/10`, paleta blue/white.
- Tabela do relatório com destaque vermelho/amber em itens faltantes.

## Arquivos afetados
- **Novo**: `src/hooks/useMateriaisPendentesPorEtapa.ts`
- **Novo**: `src/hooks/useRelatorioMateriaisConsolidado.ts`
- **Novo**: `src/components/administrativo/RelatorioMateriaisPendentesDialog.tsx`
- **Novo**: `src/utils/relatorioMateriaisPDF.ts` (gerador PDF opcional)
- **Editado**: `src/pages/administrativo/PedidosAdminMinimalista.tsx` (botão no header)
