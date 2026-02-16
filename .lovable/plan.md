

# Adicionar data de criacao e tempo corrido nos cards Neo

## Resumo
Exibir a data de criacao (`created_at`) e o tempo decorrido desde a criacao nos cards de NeoInstalacao e NeoCorrecao na visualizacao em lista da gestao de fabrica.

## Mudancas

### Arquivo: `src/components/pedidos/NeoInstalacaoCardGestao.tsx`

**Col 18 (atualmente mostra apenas a hora)**
- Substituir o conteudo da Col 18 para exibir a data de criacao formatada (dd/MM/yy) e o tempo decorrido relativo (ex: "ha 2d", "ha 5h", "ha 30min")
- Usar `created_at` do objeto `neoInstalacao`
- Manter a hora como informacao secundaria no tooltip, se existir
- Formato visual: data em texto pequeno + tempo relativo abaixo ou ao lado

### Arquivo: `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

**Col 18 (mesmo tratamento)**
- Mesma logica: exibir data de criacao e tempo decorrido
- Usar `created_at` do objeto `neoCorrecao`

### Logica do tempo decorrido
Calcular a diferenca entre `new Date()` e `new Date(created_at)`:
- Menos de 60 min: "ha Xmin"
- Menos de 24h: "ha Xh"
- Menos de 30 dias: "ha Xd"
- 30+ dias: "ha Xsem" ou data formatada

### Visual na Col 18
```
  dd/MM/yy
  ha Xd
```
Texto pequeno (9-10px), cor muted, com tooltip mostrando data/hora completa de criacao e a hora agendada (se houver).

## Arquivos envolvidos
- `src/components/pedidos/NeoInstalacaoCardGestao.tsx`
- `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

