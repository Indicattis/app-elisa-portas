

# Auto-buscar preço de pintura da tabela de preços no PinturaItemCatalogoModal

## Problema
Quando o usuário seleciona um item no modal "Pintura Eletrostática" (`PinturaItemCatalogoModal`), o valor da pintura não é buscado automaticamente da tabela de preços. No modal "Adicionar Pintura?" (`PinturaRapidaModal`) e no form de produto (`ProdutoVendaForm`), o sistema já chama `buscarPrecosPorMedidas` para preencher o valor automaticamente.

## Solução
Adicionar um `useEffect` (ou chamada no `onValueChange` do radio) em `PinturaItemCatalogoModal.tsx` que, ao selecionar um item, busca o preço da pintura via `buscarPrecosPorMedidas(largura, altura)` e pré-preenche o campo `valorPintura` com `item.valor_pintura` da tabela. O usuário ainda poderá editar manualmente.

## Arquivo alterado
- `src/components/vendas/PinturaItemCatalogoModal.tsx`

## Mudanças
1. Importar `buscarPrecosPorMedidas` e `useEffect`
2. Adicionar state `carregando` (boolean)
3. Quando `selectedIndex` mudar e o item tiver `largura` e `altura`, chamar `buscarPrecosPorMedidas(largura, altura)` e setar `valorPintura` com o `valor_pintura` retornado
4. Mostrar indicador de loading no campo de valor enquanto busca

