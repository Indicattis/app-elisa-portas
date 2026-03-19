

## Plano: Adicionar bordas coloridas agrupando as abas na Gestão de Fábrica

### O que será feito

Envolver as abas (TabsTrigger) do desktop em 3 grupos visuais com bordas coloridas:

- **Borda vermelha**: Pedidos em Aberto, Aprovação CEO, Em Produção, Inspeção de Qualidade, Aguardando Pintura, Embalagem (etapas: `aberto` → `embalagem`)
- **Borda amarela**: Expedição Coleta, Instalações, Correções (etapas: `aguardando_coleta` → `correcoes`)
- **Borda verde**: Finalizado + Arquivo Morto

### Implementação

**Arquivo: `src/pages/direcao/GestaoFabricaDirecao.tsx`**

Dentro da `TabsList` desktop (linha ~474-520), substituir o loop único `ORDEM_ETAPAS.map(...)` + tab Arquivo Morto por 3 `div` wrappers:

1. `div` com `border-2 border-red-500/50 rounded-lg p-1 flex gap-1` contendo as 6 primeiras etapas (aberto, aprovacao_ceo, em_producao, inspecao_qualidade, aguardando_pintura, embalagem)
2. `div` com `border-2 border-yellow-500/50 rounded-lg p-1 flex gap-1` contendo 3 etapas (aguardando_coleta, instalacoes, correcoes)
3. `div` com `border-2 border-green-500/50 rounded-lg p-1 flex gap-1` contendo a tab `finalizado` + `arquivo_morto`

Cada grupo renderiza seus TabsTriggers com a mesma lógica atual (ícone, label, badge, responsável tooltip). O código do map será extraído para uma função auxiliar local para evitar repetição.

### Detalhes técnicos

- Definir 3 arrays constantes para as etapas de cada grupo
- Criar função `renderTabTrigger(etapa)` reutilizável
- Manter todo o comportamento existente (tooltips, avatares, contadores)
- Apenas afeta o layout desktop (`hidden md:flex`)

