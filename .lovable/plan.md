
# Corrigir botao de avancar aparecendo sem carregamento concluido

## Problema

Quando `carregamentoConcluido` e `false` nas etapas `aguardando_coleta` e `instalacoes`, a condicao na linha 1676 falha (corretamente), mas o codigo cai no bloco generico da linha 1693 que renderiza um botao de avancar sem nenhuma verificacao de carregamento.

## Correcao em `src/components/pedidos/PedidoCard.tsx`

**Linha 1693** - Excluir `aguardando_coleta` e `instalacoes` do bloco generico de avancar:

```
} else if (proximaEtapa && etapaAtual !== 'finalizado' && etapaAtual !== 'aguardando_coleta' && etapaAtual !== 'instalacoes') {
```

Isso garante que para essas duas etapas, o botao de avancar so aparece quando passa pela condicao da linha 1676 (que exige `carregamentoConcluido`). Para todas as outras etapas, o comportamento continua o mesmo.
