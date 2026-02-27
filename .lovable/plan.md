

# Aplicar ordenacao por status de carregamento na etapa Correcoes

## Problema
A ordenacao por status de carregamento (Nao agendado > Atrasado > Agendado > Carregado) ja funciona para as etapas `aguardando_coleta` e `instalacoes`, mas a etapa `correcoes` nao possui essa logica. Pedidos de correcao nao buscam dados de carregamento e nao sao ordenados.

## Solucao

### Arquivo: `src/hooks/usePedidosEtapas.ts`

**1. Buscar dados de carregamento para correcoes (linha 332)**

Adicionar um bloco `else if (etapa === 'correcoes')` que busca da tabela `correcoes` os campos `data_carregamento` e `carregamento_concluido`, da mesma forma que ja e feito para `instalacoes`.

**2. Incluir `correcoes` na ordenacao (linha 408)**

Alterar a condicao de:
```
if (etapa === 'aguardando_coleta' || etapa === 'instalacoes')
```
Para:
```
if (etapa === 'aguardando_coleta' || etapa === 'instalacoes' || etapa === 'correcoes')
```

Isso garante que pedidos na aba Correcoes sejam ordenados com a mesma prioridade: Nao agendado (0), Atrasado (1), Agendado (2), Carregado (3).

