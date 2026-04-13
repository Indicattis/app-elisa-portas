

## Plano: Layout em colunas para Ordens de Instalação

### Resumo
Substituir o layout atual de accordions empilhados por um layout de **3 colunas** lado a lado (Aguardando Carregamento, Carregadas, Concluídas) para as ordens normais, e abaixo **2 colunas** (Instalações Avulsas, Correções Avulsas) para os itens Neo.

### Mudanças

**`src/pages/logistica/OrdensInstalacoesLogistica.tsx`**

- Remover o `Accordion` wrapper
- Criar grid de 3 colunas (`grid-cols-1 lg:grid-cols-3`) com cards fixos:
  - Coluna 1: **Aguardando Carregamento** (amber) — `ordensNaoCarregadas`
  - Coluna 2: **Carregadas** (green) — `ordensCarregadas` com botão concluir
  - Coluna 3: **Concluídas** (emerald) — `finalizados` (itens finalizados)
- Abaixo, grid de 2 colunas (`grid-cols-1 lg:grid-cols-2`):
  - Coluna 1: **Instalações Avulsas** (orange) — `neoInstalacoes`
  - Coluna 2: **Correções Avulsas** (purple) — `neoCorrecoes`
- Cada coluna será um `Card` com header colorido (icon + title + badge de contagem) e conteúdo scrollável (`max-h-[600px] overflow-y-auto`)
- Manter todos os handlers, dialogs e filtros existentes intactos
- Responsivo: empilha em coluna única no mobile

### Arquivo alterado
- `src/pages/logistica/OrdensInstalacoesLogistica.tsx`

