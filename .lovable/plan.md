

## Plano: Ativar etapa de pintura para o pedido #0285

### Alteração
Atualizar o campo `valor_pintura` do produto `be2b7b77-ed6a-469c-b178-230097d33ca2` na tabela `produtos_vendas` para `1.00` (valor simbólico).

Isso fará com que a função `determinarFluxograma` detecte `valor_pintura > 0` e inclua as etapas "Aguardando Pintura" e "Embalagem" no fluxo do pedido.

### Detalhes técnicos
- **Tabela**: `produtos_vendas`
- **Registro**: `id = 'be2b7b77-ed6a-469c-b178-230097d33ca2'`
- **Campo**: `valor_pintura` → `1.00`
- Nenhuma alteração de código necessária

