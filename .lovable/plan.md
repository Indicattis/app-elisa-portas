
# Cronometro vermelho apos 2 horas na Qualidade

## Problema
O cronometro da inspecao de qualidade em `/producao/qualidade` nao muda de cor independentemente do tempo. O requisito e que fique vermelho apos 2 horas corridas (7200 segundos).

## Solucao

### 1. `src/hooks/useCronometroOrdem.ts`
Adicionar um campo `segundosTotais` no retorno do hook para expor o valor numerico do tempo decorrido, permitindo que o componente faca logica de cor.

Retorno atual: `{ tempoDecorrido, deveAnimar }`
Retorno novo: `{ tempoDecorrido, deveAnimar, segundosTotais }`

### 2. `src/components/production/ProducaoKanban.tsx`

**2a.** Passar `tipoOrdem` para o componente `OrdemCard` (ja disponivel no `ProducaoKanban` pai).

**2b.** No `OrdemCard`, usar `segundosTotais` do hook para determinar a cor do cronometro quando `tipoOrdem === 'qualidade'`:
- Menos de 2h: cor padrao (`text-primary`, `border-primary`, `bg-primary/10`)
- 2h ou mais: cor vermelha (`text-red-500`, `border-red-500`, `bg-red-500/10`)

O circulo do cronometro e os textos mudarao dinamicamente de cor.

### 3. `src/components/fabrica/OrdemCronometro.tsx`
Aplicar a mesma logica de cor vermelha apos 2h para o componente compacto usado em `/fabrica/ordens-pedidos`, adicionando uma prop opcional `tipoOrdem`.

## Detalhes Tecnicos

- Limite: `const LIMITE_QUALIDADE = 2 * 60 * 60` (7200 segundos)
- A contagem e de tempo corrido (nao de expediente), conforme solicitado
- 3 arquivos modificados, nenhum arquivo novo
