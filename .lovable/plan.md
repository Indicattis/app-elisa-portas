
# Corrigir calculo automatico de quantidade nos botoes de sugestao

## Problema encontrado

O arquivo `PedidoLinhasEditor.tsx` nao possui a funcao `calcularQuantidadeAutomaticaItem` e sempre adiciona itens sugeridos com `quantidade: 1`. Ja o `LinhasAgrupadasPorPorta.tsx` possui essa funcao e aplica corretamente a quantidade calculada com base nas dimensoes da porta.

## Comparacao

| Arquivo | Calcula tamanho? | Calcula quantidade? |
|---|---|---|
| `LinhasAgrupadasPorPorta.tsx` | Sim | Sim (`calcularQuantidadeAutomaticaItem`) |
| `PedidoLinhasEditor.tsx` | Sim | **Nao** (hardcoded `1`) |

## Mudancas

### Arquivo: `src/components/pedidos/PedidoLinhasEditor.tsx`

1. **Adicionar a funcao `calcularQuantidadeAutomaticaItem`** (mesma logica que existe em `LinhasAgrupadasPorPorta.tsx`, linhas 64-93) logo apos a funcao `calcularTamanhoAutomatico` existente (apos linha 93).

2. **Atualizar `handleAdicionarItemPadrao`** (linha 282-301) para:
   - Chamar `calcularQuantidadeAutomaticaItem(item, porta.largura, porta.altura)`
   - Usar o resultado no campo `quantidade`: `qtdAuto ?? item.quantidade_padrao ?? 1` em vez do `1` fixo

3. **Exibir preview da quantidade nos botoes de sugestao** (linhas 577-591): alem do tamanho ja exibido, mostrar a quantidade calculada quando diferente de 1, para dar feedback visual ao vendedor.
