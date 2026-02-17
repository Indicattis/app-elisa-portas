

# Botao Concluir so aparece se Neo estiver agendada

## Resumo

Condicionar a exibicao do botao "Concluir" nos cards de Neo Instalacao e Neo Correcao para que so apareca quando o servico tiver uma data agendada (`data_instalacao` ou `data_correcao` preenchida).

## Alteracoes

### `src/components/pedidos/NeoInstalacaoCardGestao.tsx`

1. **Linha 348 (view list)**: Alterar a condicao de `onConcluir &&` para `onConcluir && neoInstalacao.data_instalacao &&` - so mostra o botao concluir se tiver data agendada.

2. **Linha 439 (view grid)**: Alterar a condicao de `onConcluir &&` para `onConcluir && neoInstalacao.data_instalacao &&` - mesma logica para o modo grid.

### `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

1. **Linha 327 (view list)**: Alterar a condicao de `onConcluir &&` para `onConcluir && neoCorrecao.data_correcao &&` - so mostra o botao concluir se tiver data agendada.

2. **Linha 411 (view grid)**: Alterar a condicao de `onConcluir &&` para `onConcluir && neoCorrecao.data_correcao &&` - mesma logica para o modo grid.

## Resultado

O botao verde de concluir so aparecera nos cards de Neo quando o servico tiver uma data de agendamento definida. Servicos pendentes (sem data) mostrarao apenas os botoes de agendar e editar.

