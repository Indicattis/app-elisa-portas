
# Correcao: Botoes da etapa "Correcoes" na Gestao de Fabrica

## Problema

Pedidos na etapa "Correcoes" exibem botoes de avançar e retroceder incondicionalmente. O fluxo correto e:
1. Apenas o botao de **agendar** deve aparecer inicialmente
2. Apos agendado e carregado (`carregamentoConcluido`), exibir o botao de **avancar**
3. **Nao** exibir botao de retroceder

## Causa raiz

Tres problemas no `PedidoCard.tsx`:

1. **Query de carregamento nao habilitada para `correcoes`** (linha 423): a query que busca o status do carregamento so roda para `aguardando_coleta`, `instalacoes` e `finalizado` -- falta `correcoes`
2. **Botao de avancar aparece incondicionalmente** (linha 1792): o catch-all do avancar nao exclui `correcoes`, entao um botao de avancar aparece sempre
3. **Botao de retroceder aparece** (linha 1621): `correcoes` nao esta na lista de exclusao do retroceder

## Alteracoes (arquivo unico: `src/components/pedidos/PedidoCard.tsx`)

### 1. Habilitar query de carregamento para `correcoes` (linha 423)

Adicionar `|| pedido.etapa_atual === 'correcoes'` na condicao `enabled` da query de carregamento.

### 2. Adicionar validacao de avanco para `correcoes` (linhas 284-291)

No `getValidacaoAvancoEtapa`, incluir `correcoes` junto com `aguardando_coleta` e `instalacoes`:

```
case 'aguardando_coleta':
case 'instalacoes':
case 'correcoes':
  return {
    podeAvancar: carregamentoConcluido,
    ...
  };
```

### 3. Esconder botao de retroceder para `correcoes` (linha 1621, grid view)

Adicionar `&& etapaAtual !== 'correcoes'` na condicao `podeRetroceder`.

### 4. Condicionar botao de avancar ao carregamento concluido (grid view, linhas 1769-1792)

Incluir `correcoes` no bloco condicional que ja trata `aguardando_coleta` e `instalacoes` com `carregamentoConcluido`:

```
} else if ((etapaAtual === 'aguardando_coleta' || etapaAtual === 'instalacoes' || etapaAtual === 'correcoes') && carregamentoConcluido) {
```

E excluir `correcoes` do catch-all na linha 1792:

```
} else if (proximaEtapa && etapaAtual !== 'finalizado' && etapaAtual !== 'aguardando_coleta' && etapaAtual !== 'instalacoes' && etapaAtual !== 'embalagem' && etapaAtual !== 'correcoes') {
```

### 5. Mesma logica no modo lista/mobile (linhas 2258, 2275, 2319)

- Incluir `correcoes` no bloco de avanco condicional (linha 2258)
- Excluir `correcoes` do catch-all de avanco (linha 2275)
- Excluir `correcoes` do retroceder (linha 2319)

### 6. Esconder botao de gerar correcao quando nao carregado (linha 1696)

Condicionar o botao "Gerar Correcao" na etapa `correcoes` a `carregamentoConcluido`, para que so apareca apos o carregamento:

```
} else if (etapasCorrecao.includes(etapaAtual) && !readOnly && !hideCorrecaoButton && (etapaAtual !== 'correcoes' || carregamentoConcluido)) {
```

## Resultado esperado

- Pedido em "Correcoes" sem agendamento: apenas botao de agendar
- Pedido em "Correcoes" agendado mas nao carregado: apenas botao de agendar (ja agendado, sem botao visivel)
- Pedido em "Correcoes" com carregamento concluido: botao de avancar + botao de gerar correcao
- Sem botao de retroceder em nenhum caso
