
# Ocultar botoes para pedidos nao carregados

## Resumo

Dois botoes devem ser ocultados quando o carregamento do pedido nao foi concluido:
1. **Enviar para Correcao** (etapas `aguardando_coleta`, `instalacoes` e `finalizado`)
2. **Avancar para Finalizado** (etapas `aguardando_coleta` e `instalacoes`)

Atualmente o botao de avancar ja fica desabilitado (cinza) quando o carregamento nao foi concluido, mas ainda aparece. O botao de correcao nao tem nenhuma verificacao.

## Alteracoes em `src/components/pedidos/PedidoCard.tsx`

### 1. Expandir a query de carregamento para a etapa `finalizado`

A query que busca o status do carregamento (linha 390) so roda para `aguardando_coleta` e `instalacoes`. Precisa incluir `finalizado` para que o botao de correcao nessa etapa tambem tenha acesso ao dado.

**Linha 390** - Alterar `enabled`:
```
enabled: pedido.etapa_atual === 'aguardando_coleta' || pedido.etapa_atual === 'instalacoes' || pedido.etapa_atual === 'finalizado'
```

### 2. Ocultar botao "Enviar para Correcao" em `aguardando_coleta`/`instalacoes` (desktop)

**Linha 1584** - Adicionar `&& carregamentoConcluido`:
```
if ((etapaAtual === 'instalacoes' || etapaAtual === 'aguardando_coleta') && !readOnly && !hideCorrecaoButton && carregamentoConcluido) {
```

### 3. Ocultar botao "Enviar para Correcao" em `finalizado` (desktop)

**Linha 1702** - Adicionar `&& carregamentoConcluido`:
```
if (etapaAtual === 'finalizado' && !readOnly && carregamentoConcluido) {
```

### 4. Ocultar botao "Enviar para Correcao" em `finalizado` (mobile)

**Linha 2140** - Adicionar `&& carregamentoConcluido`:
```
if (etapaAtual === 'finalizado' && !readOnly && carregamentoConcluido) {
```

### 5. Ocultar botao de avancar em `aguardando_coleta`/`instalacoes` (desktop)

**Linha 1676** - Adicionar `&& carregamentoConcluido` para que o botao nao apareca (em vez de apenas ficar desabilitado):
```
} else if ((etapaAtual === 'aguardando_coleta' || etapaAtual === 'instalacoes') && carregamentoConcluido) {
```

Quando `carregamentoConcluido` for `false`, nenhum dos blocos de avancar sera atingido e o botao simplesmente nao renderiza.

## Nenhuma outra pagina precisa de alteracao

Todas as verificacoes ficam dentro do `PedidoCard.tsx`, que e o componente reutilizado em Expedicao e Gestao de Fabrica.
