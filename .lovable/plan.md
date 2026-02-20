

# Layout de Pastas para Observacoes da Visita Tecnica

## Resumo

Substituir a listagem sequencial de formularios de observacoes (tanto para portas de enrolar quanto portas sociais) pelo mesmo layout de pastas (folder cards) usado na secao "Itens do Pedido". O usuario clicara em uma pasta para expandir o formulario de observacoes daquela porta especifica.

## Comportamento

```text
ESTADO ATUAL:
  - Cada porta exibe um Collapsible com badge + formulario empilhado

NOVO ESTADO:
  - Grid de PortaFolderCard (2-3 colunas) mostrando cada porta
  - Ao clicar em uma pasta, expande abaixo o formulario correspondente (ObservacoesPortaForm / ObservacoesPortaSocialForm)
  - Apenas uma pasta aberta por vez (por secao)
  - Badge indicando status (Pendente / Preenchido) no folder card
```

## Alteracoes

### `src/components/pedidos/PortaFolderCard.tsx`

1. Tornar as props `linhasCount` e `categorias` opcionais (com defaults) para poder reutilizar o card em contextos sem linhas
2. Adicionar prop opcional `statusBadge` (string) para exibir um badge customizado (ex: "Pendente", "Preenchido") no lugar do badge de contagem de itens

### `src/pages/administrativo/PedidoViewMinimalista.tsx`

**Secao "Observacoes da visita tecnica" (portas de enrolar, linhas ~755-782):**

1. Adicionar state `pastaObsAberta` (tipo `string | null`) para rastrear qual pasta de observacoes esta expandida
2. Substituir o `div > map > ObservacoesPortaForm` por:
   - Grid de `PortaFolderCard` (um por porta de enrolar) com label, dimensoes e badge de status (pendente/preenchido baseado em `responsavel_medidas_id`)
   - Abaixo do grid, renderizar condicionalmente o `ObservacoesPortaForm` da porta selecionada com `defaultOpen={true}`
3. Ao clicar em um folder card, setar `pastaObsAberta` para o `_virtualKey` da porta; clicar novamente fecha

**Secao "Especificacoes Porta Social" (linhas ~785-809):**

1. Adicionar state `pastaSocialAberta` (tipo `string | null`)
2. Aplicar o mesmo padrao de grid de folder cards + formulario expandido condicionalmente
3. Badge de status baseado no preenchimento das observacoes sociais

### Detalhes visuais

- Grid: `grid grid-cols-2 md:grid-cols-3 gap-3` (mesmo da secao de itens)
- Pasta expandida: container com borda, header com botao voltar e label, corpo com o formulario
- O `ObservacoesPortaForm` e `ObservacoesPortaSocialForm` serao renderizados sem o Collapsible wrapper externo (sempre abertos quando a pasta esta selecionada) -- passar `defaultOpen={true}` ou remover o collapsible interno quando usado neste contexto

