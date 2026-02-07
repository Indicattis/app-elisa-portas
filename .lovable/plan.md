
# Plano: Agrupar linhas por porta em layout de pastas em grid

## Resumo

Transformar a exibicao atual das linhas do pedido (tabela unica com headers de grupo) em um layout de "pastas" em grid, onde cada porta aparece como um card/pasta independente que pode ser expandido para ver suas linhas.

## Layout proposto

```text
+---------------------------+  +---------------------------+
| Porta de Enrolar #1       |  | Porta de Enrolar #2       |
| 4.65m x 6.00m             |  | 4.72m x 6.00m             |
| 17 itens                  |  | 12 itens                  |
| [Expandir]                |  | [Expandir]                |
+---------------------------+  +---------------------------+

+---------------------------+  +---------------------------+
| Porta de Enrolar #3 (1/3) |  | Porta de Enrolar #4 (2/3) |
| 4.75m x 6.00m             |  | 4.75m x 6.00m             |
| 8 itens                   |  | 8 itens                   |
| [Expandir]                |  | [Expandir]                |
+---------------------------+  +---------------------------+
```

Ao expandir uma pasta, a tabela de linhas daquela porta aparece abaixo do grid (fora do grid, em largura total), mostrando produto, categoria, quantidade, tamanho e acoes.

## Detalhes Tecnicos

### Arquivo modificado: `src/components/pedidos/PedidoLinhasEditor.tsx`

Substituir o bloco de renderizacao principal (linhas ~496-961) que atualmente usa `<table>` com headers de grupo, por:

1. **Grid de cards (pastas)**: `grid grid-cols-2 md:grid-cols-3 gap-3`
   - Cada card mostra: label da porta, dimensoes, contagem de linhas, badges de categorias presentes
   - Card clicavel para expandir/selecionar

2. **Estado de pasta aberta**: Novo estado `const [pastaAberta, setPastaAberta] = useState<string | null>(null)`
   - Ao clicar num card, abre a pasta (toggle)
   - A tabela de linhas da porta selecionada aparece em largura total abaixo do grid

3. **Tabela de linhas expandida**: Quando uma pasta esta aberta, renderizar a tabela existente (mesma logica de `renderLinha`) filtrada apenas para as linhas daquela porta

4. **Grupo "Sem produto"**: Aparece como um card adicional no grid para linhas sem `produto_venda_id`

5. **Formulario de nova linha**: O botao "Adicionar Produto" e o formulario inline continuam funcionando, mas dentro da pasta aberta (pre-selecionando a porta)

6. **Sugestoes de itens padrao**: Movidas para dentro da pasta aberta (ao inves de no topo geral)

### Preservar funcionalidades existentes
- Edicao inline de quantidade/tamanho
- Edicao completa (porta + produto) via popover
- Duplicar/remover linhas
- Checkboxes (separacao/qualidade/coleta)
- Adicionar nova linha
- Itens padrao sugeridos
