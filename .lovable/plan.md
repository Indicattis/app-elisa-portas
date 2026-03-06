

# Adicionar Pintura a Itens de Catálogo na Criação de Venda

## Resumo
Permitir que, ao selecionar itens do catálogo no modal `SelecionarAcessoriosModal`, o vendedor possa marcar que o item será pintado, selecionar a cor e informar o valor da pintura manualmente. O item salvo terá `valor_pintura > 0` e `cor_id` preenchido, garantindo que no pedido o fluxograma detecte pintura corretamente.

## Mudanças

### 1. Expandir `SelecionarAcessoriosModal.tsx`
- Após selecionar itens e clicar "Adicionar", em vez de fechar direto, abrir uma etapa intermediária para configurar pintura nos itens selecionados.
- Para cada item selecionado, exibir:
  - Toggle/checkbox "Pintura?" 
  - Se marcado: select de cor (usando query `catalogo_cores`) + input de valor da pintura (manual, R$)
- Ao confirmar, gerar o `ProdutoVenda` com `valor_pintura` e `cor_id` preenchidos quando aplicável.

### 2. Fluxo do modal (duas etapas)
```text
Etapa 1: Seleção de itens (como hoje)
  → Clica "Adicionar"
Etapa 2: Configuração de pintura (novo)
  → Para cada item: toggle pintura, cor, valor
  → Clica "Confirmar"
  → Gera ProdutoVenda[] com valor_pintura e cor_id
```

Se nenhum item tiver pintura marcada, a etapa 2 pode ser pulada (botão "Pular" ou auto-skip).

### 3. Dados gerados
Quando pintura marcada, o `ProdutoVenda` gerado terá:
- `valor_pintura`: valor informado pelo vendedor
- `cor_id`: ID da cor selecionada
- Os demais campos permanecem iguais

### 4. Impacto no fluxograma
Com `valor_pintura > 0` no produto, o `determinarFluxograma` já detecta pintura (`p.valor_pintura > 0`). Combinado com a correção planejada de incluir itens de catálogo na ordem de pintura (plano anterior), o fluxo ficará completo.

### 5. Exibição no pedido
Na tabela de produtos da venda e no pedido, itens com `valor_pintura > 0` e `cor_id` já mostram indicação de pintura nos componentes existentes.

### Arquivo alterado
- `src/components/vendas/SelecionarAcessoriosModal.tsx`

