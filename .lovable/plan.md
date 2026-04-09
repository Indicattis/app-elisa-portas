
## Plano: Botão de gerar PDF na página de Gastos

### Alteração

**`src/pages/administrativo/GastosPage.tsx`**

1. Adicionar botão "PDF" (ícone `FileText`) ao lado do botão "Novo Gasto" no header
2. Ao clicar, gerar um PDF client-side usando `jspdf` + `jspdf-autotable` com:
   - Cabeçalho: "Relatório de Gastos — [mês/ano]"
   - Filtro aplicado (se houver): "Tipo: [nome do tipo]"
   - Tabela com colunas: Tipo de Custo, Descrição, Valor, Data, Banco, Responsável
   - Linha de total no final
   - Formatação em BRL para valores e dd/MM/yyyy para datas
3. O PDF abre em nova aba para impressão

**Dependência**: instalar `jspdf` e `jspdf-autotable` via npm

### Arquivos alterados
- `src/pages/administrativo/GastosPage.tsx` (~30 linhas adicionadas)
- `package.json` (2 dependências)
