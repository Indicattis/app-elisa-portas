

# Adicionar checkbox "Conferir no Estoque" na edicao de produto

## Resumo
Adicionar um campo booleano na tabela `estoque` e um checkbox na pagina de edicao de produto para definir se o item deve aparecer na conferencia de estoque. Apenas itens marcados aparecerao na conferencia.

## Alteracoes

### 1. Migracao de banco de dados
- Adicionar coluna `conferir_estoque` (boolean, default `true`) na tabela `estoque`
- Default `true` para que todos os produtos existentes continuem aparecendo na conferencia

### 2. Arquivo: `src/pages/direcao/estoque/ProdutosFabricaEdit.tsx`
- Importar o componente `Checkbox` de `@/components/ui/checkbox`
- Adicionar `conferir_estoque: true` ao estado `formData` (linha 40)
- Carregar o valor do banco no `useEffect` (linha 83)
- Incluir `conferir_estoque` no `handleSave` (linha 106)
- Adicionar um checkbox com label "Conferir na conferencia de estoque" no card "Informacoes do Produto", abaixo da descricao (apos linha 242)

### 3. Arquivo: `src/hooks/useConferenciaEstoque.ts`
- Na query de produtos (linha 104), adicionar filtro `.eq("conferir_estoque", true)` para que apenas itens marcados aparecam na lista de conferencia
- Na query de contagem ao iniciar conferencia (linha 140), adicionar o mesmo filtro
- Na query de criacao de itens da conferencia (linha 163), adicionar o mesmo filtro

### 4. Arquivo: `src/hooks/useEstoque.ts` (tipo)
- Adicionar `conferir_estoque: boolean` ao interface `ProdutoEstoque` (linha 44)
- Adicionar `conferir_estoque?: boolean` ao interface `ProdutoEstoqueInput` (linha 65)

