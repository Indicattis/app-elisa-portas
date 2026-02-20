
# Adicionar Modulo de Calculo para Quantidade Padrao

## Resumo

Atualmente a `quantidade_padrao` e um numero fixo. O objetivo e permitir que a quantidade seja calculada automaticamente com base nas dimensoes da porta (largura ou altura), usando um operador matematico (multiplicar, dividir, somar, subtrair) e um valor.

Exemplo: Se o eixo for "largura" (2.50m), o operador for "dividir" e o valor for 0.10, a quantidade resultante sera 25.

## Alteracoes no Banco de Dados

Criar 3 novas colunas na tabela `estoque`:

```text
qtd_eixo_calculo    -> 'largura' | 'altura' | null
qtd_operador        -> 'multiplicar' | 'dividir' | 'somar' | 'subtrair' | null
qtd_valor_calculo   -> numeric | null
```

Migracao SQL:
- ALTER TABLE estoque ADD COLUMN qtd_eixo_calculo text
- ALTER TABLE estoque ADD COLUMN qtd_operador text
- ALTER TABLE estoque ADD COLUMN qtd_valor_calculo numeric

## Alteracoes no Formulario de Edicao

**Arquivo: `src/pages/administrativo/EstoqueEditMinimalista.tsx`**

Dentro da secao "Configuracoes de Calculo Automatico", abaixo do campo `quantidade_padrao`, adicionar uma subsecao:

- Titulo: "Calculo automatico de quantidade"
- Descricao explicativa: "Quando configurado, a quantidade sera calculada com base nas dimensoes da porta ao inserir o item no pedido. Se nao configurado, sera usada a quantidade padrao acima."
- 3 campos em grid:
  1. **Eixo** (Select): Largura / Altura
  2. **Operador** (Select): Multiplicar / Dividir / Somar / Subtrair
  3. **Valor** (Input numerico)
- Botao para limpar o calculo (resetar os 3 campos para null)

Adicionar os 3 novos campos ao state `formData`, ao `useEffect` de carregamento e ao `handleSubmit`.

## Alteracoes no Hook de Estoque

**Arquivo: `src/hooks/useEstoque.ts`**

Adicionar os 3 novos campos nas interfaces `ProdutoEstoque` e `ProdutoEstoqueInput`:
- qtd_eixo_calculo: 'largura' | 'altura' | null
- qtd_operador: 'multiplicar' | 'dividir' | 'somar' | 'subtrair' | null
- qtd_valor_calculo: number | null

## Alteracoes na Logica de Insercao de Linhas

**Arquivo: `src/components/pedidos/AdicionarLinhaModal.tsx`**

Na funcao `handleSelecionarProduto`, adicionar logica:

```text
Se produto tem qtd_eixo_calculo + qtd_operador + qtd_valor_calculo:
  eixoValor = (qtd_eixo_calculo === 'largura') ? portaLargura : portaAltura
  
  resultado = aplicar operador:
    multiplicar -> eixoValor * qtd_valor_calculo
    dividir     -> eixoValor / qtd_valor_calculo
    somar       -> eixoValor + qtd_valor_calculo
    subtrair    -> eixoValor - qtd_valor_calculo
  
  quantidade = Math.ceil(resultado)  // arredonda para cima
Senao:
  quantidade = produto.quantidade_padrao || 1
```

Exibir badge "Qtd Calculada" ao lado da quantidade quando for auto-calculada.

**Arquivo: `src/components/pedidos/LinhasAgrupadasPorPorta.tsx`**

Aplicar a mesma logica ao inserir itens padrao de porta de enrolar automaticamente. Atualizar a interface `ItemPadraoPortaEnrolar` com os novos campos e a query de select.

## Arquivos modificados

1. Nova migracao SQL (3 colunas)
2. `src/hooks/useEstoque.ts` - interfaces
3. `src/pages/administrativo/EstoqueEditMinimalista.tsx` - formulario
4. `src/components/pedidos/AdicionarLinhaModal.tsx` - logica de calculo de quantidade
5. `src/components/pedidos/LinhasAgrupadasPorPorta.tsx` - logica para itens padrao
