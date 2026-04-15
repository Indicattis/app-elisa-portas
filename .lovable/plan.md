

## Separar Instalação como Produto Independente (igual Pintura)

### Problema atual
A instalação é armazenada como `valor_instalacao` dentro do produto porta, inflando a base de cálculo de desconto e complicando o faturamento. A pintura já é separada como `tipo_produto = 'pintura_epoxi'` — queremos o mesmo padrão para instalação.

### Novo tipo de produto: `instalacao`

Criar um novo tipo `instalacao` que funciona exatamente como `pintura_epoxi`:
- Produto separado na tabela `produtos_vendas`
- Vinculado visualmente à porta de origem
- `valor_produto` = valor da instalação da tabela de preços
- `valor_instalacao = 0` (o valor já é o produto em si)
- Descrição automática: "Instalação - Porta de Enrolar 4.72x5.50m"

### Plano de implementação

**1. Tipo ProdutoVenda** (`src/hooks/useVendas.ts`)
- Adicionar `'instalacao'` ao union type de `tipo_produto`

**2. Formulário de Porta** (`src/components/vendas/ProdutoVendaForm.tsx`)
- Quando o checkbox "Incluir Instalação" estiver marcado, ao submeter:
  - Salvar a porta com `valor_instalacao = 0`
  - Chamar `onAddProduto` uma segunda vez com um produto `tipo_produto: 'instalacao'` contendo o valor da instalação em `valor_produto`, mesmas dimensões da porta, e descrição "Instalação"
- Ao editar porta com instalação existente, mostrar checkbox marcado mas a instalação é o item separado

**3. Labels e badges** (vários arquivos)
- Adicionar `'instalacao': 'Instalação'` em `getTipoProdutoLabel`, `tipoProdutoLabels`, `FaturamentoProdutosTable`, etc.

**4. Cálculos de valor total** (~17 arquivos)
- Em todos os locais que fazem `(valor_produto + valor_pintura + valor_instalacao) * qty`, o `valor_instalacao` será sempre 0 para novos registros, então não quebra nada
- O produto de instalação separado será somado naturalmente como qualquer outro produto

**5. Faturamento** (`FaturamentoVendaMinimalista.tsx`, `FaturamentoProdutosTable.tsx`)
- A instalação aparecerá como linha própria na tabela, com lucro próprio
- Remover lógica especial de `lucro_instalacao` / `custo_instalacao` da finalização (campos legados)

**6. Migração de dados** (SQL migration)
- Para vendas **não faturadas** (12 vendas, 16 produtos com `valor_instalacao > 0`):
  - Inserir novo registro `tipo_produto = 'instalacao'` com `valor_produto = valor_instalacao` original
  - Zerar o `valor_instalacao` do produto porta original
  - Recalcular `valor_total` da porta (subtraindo a instalação)
- Vendas já faturadas (336 produtos) permanecem intactas para não corromper dados históricos

**7. Atualizar ProdutosVendaTable** (`src/components/vendas/ProdutosVendaTable.tsx`)
- Adicionar label/badge para tipo `instalacao`

**8. Atualizar PinturaItemCatalogoModal como referência**
- Criar modal similar ou reutilizar a mesma lógica do checkbox no form para gerar o produto de instalação automaticamente

### Arquivos impactados
- `src/hooks/useVendas.ts` — tipo
- `src/components/vendas/ProdutoVendaForm.tsx` — lógica principal
- `src/components/vendas/ProdutosVendaTable.tsx` — exibição
- `src/components/vendas/FaturamentoProdutosTable.tsx` — exibição
- `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` — cálculos
- `src/pages/administrativo/FaturamentoProdutosMinimalista.tsx` — cálculos  
- `src/utils/creditoVendasRules.ts` — cálculo total
- `src/utils/vendaIndividualPDFGenerator.ts` — PDF
- `src/pages/VendasNova.tsx` e `src/pages/vendas/VendaNovaMinimalista.tsx` — criação
- `src/pages/VendaEdit.tsx` — edição
- `src/hooks/useProdutosVenda.ts` — faturamento
- `src/lib/faturamentoStatus.ts` — status
- **Migração SQL** para as 12 vendas pendentes

### O que NÃO muda
- Vendas já faturadas ficam intactas
- Pintura continua funcionando igual
- Estrutura da tabela `produtos_vendas` não precisa de nova coluna

