

## Plano: Mostrar link do anexo da visita técnica na downbar de carregamento

### Problema
A downbar de carregamento (`CarregamentoDownbar.tsx`) não exibe o link para o anexo da visita técnica. O campo `ficha_visita_url` existe na tabela `pedidos_producao`, mas o hook `useOrdensCarregamentoUnificadas` não o busca.

### Mudanças

**1. `src/hooks/useOrdensCarregamentoUnificadas.ts`**
- Adicionar `ficha_visita_url` e `ficha_visita_nome` no select de `pedidos_producao` (nos 3 pontos: ordens_carregamento, instalacoes e correcoes)
- Adicionar esses campos na interface `OrdemCarregamentoUnificada.pedido`

**2. `src/components/carregamento/CarregamentoDownbar.tsx`**
- Adicionar seção com link para o anexo da visita técnica quando `ordem.pedido?.ficha_visita_url` existir
- Usar ícone `ExternalLink` / `Paperclip`, estilo visual consistente (tons de blue/purple), abrindo em nova aba

