

# Pintura Eletrostática: Selecionar Item Existente para Pintar

## Resumo
Reverter o modal de acessórios ao fluxo original (sem etapa de pintura) e alterar o botão "Pintura Eletrostática" para abrir um novo modal que lista os itens de catálogo já adicionados à venda, permitindo selecionar qual deles receberá pintura (cor + valor).

## Mudanças

### 1. Reverter `SelecionarAcessoriosModal.tsx` ao fluxo original
- Remover a etapa `'pintura'`, o state `pinturaConfigs`, e toda a lógica de duas etapas.
- O botão "Avançar" volta a ser "Adicionar" e fecha o modal diretamente, gerando os `ProdutoVenda[]` sem campos de pintura.
- Remover imports não mais necessários (`Paintbrush`, `ArrowLeft`, `useCatalogoCores`, `Select`).

### 2. Criar novo componente `PinturaItemCatalogoModal.tsx`
Modal que:
- Recebe a lista de `portas` (produtos da venda) como prop
- Filtra e exibe apenas itens de catálogo (`vendas_catalogo_id` preenchido) ou todos os itens, para o vendedor escolher
- Para cada item, permite marcar pintura com seleção de cor (`useCatalogoCores`) e input de valor manual
- Ao confirmar, retorna um `ProdutoVenda` do tipo `pintura_epoxi` com `cor_id`, `valor_pintura` e `descricao` referenciando o item pintado

### 3. Alterar `VendaNovaMinimalista.tsx`
- O botão "Pintura Eletrostática" passa a abrir o novo `PinturaItemCatalogoModal` em vez do form de produto.
- Adicionar state para controlar abertura do novo modal.
- O `onConfirm` do modal adiciona o produto de pintura ao array `portas`.

## Arquivos
- `src/components/vendas/SelecionarAcessoriosModal.tsx` — reverter ao fluxo simples
- `src/components/vendas/PinturaItemCatalogoModal.tsx` — novo componente
- `src/pages/vendas/VendaNovaMinimalista.tsx` — integrar novo modal

