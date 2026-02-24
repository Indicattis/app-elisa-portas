
# Filtrar correções da aba Entregas

## Problema

A pagina `Entregas.tsx` filtra ordens de carregamento por `valor_instalacao == 0 ou null`, mas nao exclui pedidos cuja etapa atual e `correcoes`. Como correções tipicamente tem `valor_instalacao = 0`, elas passam no filtro e aparecem indevidamente.

## Solucao

### Arquivo: `src/pages/Entregas.tsx`

Adicionar uma condicao extra no filtro para excluir ordens cujo pedido esta na etapa `correcoes`:

```text
const ordensEntrega = ordens.filter(ordem => {
  const semInstalacao = ordem.venda?.valor_instalacao == null || ordem.venda.valor_instalacao === 0;
  const filtroStatus = mostrarConcluidos || ordem.status !== 'concluida';
  const naoECorrecao = ordem.pedido?.etapa_atual !== 'correcoes';
  return semInstalacao && filtroStatus && naoECorrecao;
});
```

Uma unica linha adicionada no filtro existente.
