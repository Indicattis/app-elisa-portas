
# Atualizar modal de adicao de produtos

## Resumo
O modal de adicao de produtos esta faltando dois campos que existem como colunas na listagem:
1. **Quantidade Maxima (Est. Max)** - campo numerico para definir o limite maximo de estoque
2. **Conferir Estoque** - checkbox para definir se o item deve ser conferido

## Alteracoes no arquivo `src/pages/direcao/estoque/ProdutosFabrica.tsx`

### 1. Adicionar campos ao estado `formData` (linha 220-237)
- Adicionar `quantidade_maxima: 0` ao estado inicial
- Adicionar `conferir_estoque: false` ao estado inicial

### 2. Adicionar campo "Quantidade Maxima" no formulario (apos linha 506)
- Inserir um terceiro campo no grid de quantidades (ja tem Quantidade e Qtd. Ideal)
- Transformar o grid de `grid-cols-3` para `grid-cols-4` ou manter em 3 colunas adicionando a nova linha
- O campo sera um Input numerico similar ao de Qtd. Ideal

### 3. Adicionar checkbox "Conferir Estoque" no formulario (apos linha 591)
- Adicionar um checkbox similar ao "Requer Pintura" ja existente
- Label: "Conferir estoque deste item"

### 4. Atualizar o handleSubmit (linhas 313-328)
- Incluir `quantidade_maxima` e `conferir_estoque` nos dados enviados ao `adicionarProduto`

### 5. Atualizar o reset do formData (linhas 331-347)
- Incluir `quantidade_maxima: 0` e `conferir_estoque: false` no reset apos sucesso
