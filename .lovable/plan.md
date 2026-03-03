

# Nova aba "Arquivo Morto" em /direcao/gestao-fabrica

## Resumo
Adicionar uma aba extra nas tabs de etapas para exibir pedidos arquivados, reutilizando o hook `usePedidosArquivados` existente.

## Alteracoes em `src/pages/direcao/GestaoFabricaDirecao.tsx`

1. **Importar** `Archive` do lucide-react e `usePedidosArquivados` do hook existente
2. **Adicionar `arquivo_morto` ao `ETAPA_ICONS`** com icone `Archive`
3. **Permitir `etapaAtiva` aceitar `'arquivo_morto'`** — alterar o tipo do state para `EtapaPedido | 'arquivo_morto'`
4. **Adicionar tab trigger extra** após o loop de `ORDEM_ETAPAS` tanto no desktop quanto no mobile, com label "Arquivo Morto" e contador vindo do hook
5. **Adicionar `TabsContent value="arquivo_morto"`** após o loop de tabs content, contendo:
   - Campo de busca dedicado (input com icone de lupa)
   - Lista de cards dos pedidos arquivados (reutilizando o layout de cards do ArquivoMorto.tsx — nome, numero, data arquivamento, quem arquivou, valor)
   - Estado de loading e vazio

6. **Condicionar** as queries de etapas normais (`usePedidosEtapas`, filtros, etc.) para não executar quando `etapaAtiva === 'arquivo_morto'`, evitando queries desnecessárias — usar `enabled` option ou simplesmente ignorar no render

A aba aparecerá como a última tab, com cor diferenciada (emerald) para distinguir visualmente das etapas de produção.

