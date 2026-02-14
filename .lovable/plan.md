
# Redesign da /producao/home no estilo minimalista

## Resumo
Reescrever a pagina `/producao/home` (ProducaoHome.tsx) para usar o estilo minimalista (fundo preto, cards com glassmorphism) com botoes hardcoded para os 11 itens solicitados. Criar 2 novas paginas: Embalagem (captura de ordens) e Instalacoes (cronograma por equipe).

## Alteracoes

### 1. Reescrever `src/pages/ProducaoHome.tsx`
- Remover a logica dinamica de buscar rotas do banco e verificar acesso
- Definir um array estatico com os 11 botoes:
  1. **Solda** -> `/producao/solda`
  2. **Perfiladeira** -> `/producao/perfiladeira`
  3. **Separacao** -> `/producao/separacao`
  4. **Qualidade** -> `/producao/qualidade`
  5. **Pintura** -> `/producao/pintura`
  6. **Embalagem** -> `/producao/embalagem` (nova)
  7. **Carregamento** -> `/producao/carregamento`
  8. **Instalacoes** -> `/producao/instalacoes` (nova)
  9. **Terceirizacao** -> `/producao/terceirizacao`
  10. **Estoque** -> `/producao/conferencia-estoque`
  11. **Almoxarifado** -> `/producao/conferencia-almox`
- Estilo minimalista: fundo preto, grid de cards com `bg-white/5 border border-white/10 backdrop-blur-xl`, icones com gradiente azul
- Manter contadores de ordens (useOrdensCount) nos botoes que ja possuem
- Manter botao "Meu Historico" no header
- Remover secoes separadas (Paineis / Conferencia), tudo em um unico grid

### 2. Criar `src/pages/producao/ProducaoEmbalagem.tsx`
- Clone funcional de `src/pages/fabrica/producao/EmbalagemMinimalista.tsx` adaptado para a interface `/producao`
- Usa `ProducaoLayout` em vez de `MinimalistLayout` (para manter consistencia com as demais paginas /producao/*)
- Mesmos hooks: `useOrdemEmbalagem`, `usePedidoAutoAvanco`
- Mesmos componentes: `ProducaoPinturaKanban`, `OrdemDetalhesSheet`, `ProcessoAvancoAutomaticoModal`

### 3. Criar `src/pages/producao/ProducaoInstalacoes.tsx`
- Clone de `src/pages/logistica/CronogramaMinimalista.tsx` adaptado para a interface /producao
- Usa `ProducaoLayout` em vez do layout manual com fundo preto
- Mesmos hooks: `useInstalacoesMinhaEquipeCalendario`, `useNeoInstalacoesMinhaEquipe`, `useNeoCorrecoesMinhaEquipe`
- Filtros de equipe e autorizado para gerentes
- Calendario semanal/mensal com ordens de instalacao
- Breadcrumb e navegacao de retorno apontam para `/producao/home`

### 4. Registrar novas rotas em `src/App.tsx`
- Adicionar imports para `ProducaoEmbalagem` e `ProducaoInstalacoes`
- Adicionar rotas dentro do bloco `/producao/*`:
  - `/embalagem` -> `ProducaoEmbalagem` (com `ProtectedProducaoRoute`)
  - `/instalacoes` -> `ProducaoInstalacoes` (com `ProtectedProducaoRoute`)

## Secao Tecnica

### Estrutura do array de botoes (ProducaoHome)
```text
const BOTOES = [
  { label: "Solda", icon: Hammer, path: "/producao/solda", countKey: "solda" },
  { label: "Perfiladeira", icon: Rows3, path: "/producao/perfiladeira", countKey: "perfiladeira" },
  { label: "Separacao", icon: Package, path: "/producao/separacao", countKey: "separacao" },
  { label: "Qualidade", icon: CheckSquare, path: "/producao/qualidade", countKey: "qualidade" },
  { label: "Pintura", icon: Paintbrush, path: "/producao/pintura", countKey: "pintura" },
  { label: "Embalagem", icon: PackageCheck, path: "/producao/embalagem" },
  { label: "Carregamento", icon: Truck, path: "/producao/carregamento", countKey: "carregamento" },
  { label: "Instalacoes", icon: Wrench, path: "/producao/instalacoes" },
  { label: "Terceirizacao", icon: Building2, path: "/producao/terceirizacao" },
  { label: "Estoque", icon: ClipboardCheck, path: "/producao/conferencia-estoque" },
  { label: "Almoxarifado", icon: Boxes, path: "/producao/conferencia-almox" },
]
```

### Estilo minimalista dos cards
Os cards seguem o padrao ja usado em `ProducaoMinimalista.tsx` (fabrica):
- Container com `bg-black text-white`
- Cards com `bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-blue-500/30`
- Icones em `bg-gradient-to-br from-blue-500 to-blue-700`

### Novas paginas
- `ProducaoEmbalagem`: reutiliza os mesmos hooks e componentes da versao minimalista, mas sem `MinimalistLayout` (usa `ProducaoLayout` do wrapper em App.tsx)
- `ProducaoInstalacoes`: reutiliza hooks de equipe/calendario, mas renderiza dentro do `ProducaoLayout`

### Arquivos afetados
1. `src/pages/ProducaoHome.tsx` - reescrita completa
2. `src/pages/producao/ProducaoEmbalagem.tsx` - novo arquivo
3. `src/pages/producao/ProducaoInstalacoes.tsx` - novo arquivo
4. `src/App.tsx` - 2 novos imports + 2 novas rotas
