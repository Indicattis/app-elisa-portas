

# Adicionar botoes de download PDF e Excel em Minhas Vendas

## Objetivo
Adicionar um dropdown de exportacao (PDF e Excel) na pagina `/vendas/minhas-vendas`, reutilizando a mesma logica ja existente em `src/pages/Vendas.tsx`.

## Alteracoes em `src/pages/vendas/MinhasVendas.tsx`

### 1. Novos imports
- `Download, FileText, FileSpreadsheet` do lucide-react
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` do radix
- `* as XLSX` do pacote xlsx
- `generateVendasRelatorioPDF` de `@/utils/vendasPDFGenerator`
- `toast` do sonner (ou useToast)

### 2. Adicionar funcao `handleExportarPDF`
Mapear `vendasFiltradas` para o formato esperado pelo `generateVendasRelatorioPDF`, passando as stats (totalVendas, valorTotal, totalPortasEnrolar contando produtos do tipo `porta_enrolar`).

### 3. Adicionar funcao `handleExportarExcel`
Mapear `vendasFiltradas` para colunas amigaveis e gerar arquivo `.xlsx` usando a lib `xlsx`, seguindo o mesmo padrao de `Vendas.tsx`.

### 4. Adicionar botao na area de filtros
Ao lado do `ColumnManager` (linha 422-428), adicionar um `DropdownMenu` com icone `Download` contendo duas opcoes:
- "Exportar PDF" com icone `FileText`
- "Exportar Excel" com icone `FileSpreadsheet`

O botao seguira o mesmo estilo visual dos outros botoes de filtro (border-blue-500/20, bg-blue-500/5, etc.)

## Arquivo alterado
- `src/pages/vendas/MinhasVendas.tsx`

## Impacto
- Nenhuma alteracao de banco de dados
- Reutiliza utilitarios existentes (vendasPDFGenerator, xlsx)
- Exporta apenas as vendas filtradas visiveis na tela
