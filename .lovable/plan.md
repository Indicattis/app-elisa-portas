
# Corrigir pedido avancando sem aprovacao CEO

## Problema

O pedido `fb954ee7` avancou de "Em Aberto" diretamente para "Em Producao", pulando a validacao da etapa "Aprovacao CEO". Os checkboxes obrigatorios ("Pedido revisado pela diretoria" e "Aprovado para producao") permaneceram desmarcados, mas o pedido avancou mesmo assim.

## Causa raiz

No arquivo `src/hooks/usePedidosEtapas.ts`, a validacao de checkboxes (linha 600-611) e completamente ignorada quando `skipCheckboxValidation = true`. O unico estagio protegido de forma especial e `em_producao` (que valida ordens de producao em vez de checkboxes).

Quando o usuario clica "Avancar" na pagina de administracao, o `PedidoCard` chama `onMoverEtapa(pedido.id, true, ...)` — passando `skipCheckboxValidation: true`. Isso faz o pedido avancar de `aberto` para `aprovacao_ceo` sem checar checkboxes (o que e aceitavel, pois os checkboxes de "aberto" sao apenas informativos nesse contexto).

Porem, se o botao e clicado duas vezes rapidamente, ou se ha algum re-trigger, a segunda chamada encontra o pedido ja em `aprovacao_ceo` e avanca para `em_producao` — tambem com `skipCheckboxValidation: true`, pulando os checkboxes obrigatorios da aprovacao CEO.

## Solucao

Adicionar uma protecao especifica para a etapa `aprovacao_ceo` na funcao `moverParaProximaEtapa` em `src/hooks/usePedidosEtapas.ts`. A etapa de aprovacao CEO **nunca** deve ter seus checkboxes ignorados, independente do valor de `skipCheckboxValidation`. Somente o hook `usePedidosAprovacaoCEO` (usado na pagina de aprovacoes da direcao) deve poder avancar dessa etapa, e ele ja passa `skipCheckboxValidation: true` apos a aprovacao explicita do CEO.

## Mudanca

### Arquivo: `src/hooks/usePedidosEtapas.ts` (linhas 600-611)

Alterar a condicao de validacao de checkboxes para sempre validar na etapa `aprovacao_ceo`:

```text
// Antes:
if (!skipCheckboxValidation && etapaAtualNome !== 'em_producao') {

// Depois:
if (etapaAtualNome === 'aprovacao_ceo' || (!skipCheckboxValidation && etapaAtualNome !== 'em_producao')) {
```

Isso garante que:
- A etapa `aprovacao_ceo` sempre valida checkboxes, bloqueando avancos indevidos
- O CEO aprova pela pagina de aprovacoes, que primeiro marca os checkboxes via mutation e so depois chama o avanco
- As demais etapas continuam funcionando normalmente com `skipCheckboxValidation`

### Ajuste no hook de aprovacao CEO: `src/hooks/usePedidosAprovacaoCEO.ts`

Atualizar a funcao `aprovarPedido` para primeiro marcar os checkboxes como concluidos antes de chamar `moverParaProximaEtapa`:

```text
// Antes de chamar moverParaProximaEtapa, marcar todos os checkboxes como checked
const { data: etapaData } = await supabase
  .from('pedidos_etapas')
  .select('checkboxes')
  .eq('pedido_id', pedidoId)
  .eq('etapa', 'aprovacao_ceo')
  .maybeSingle();

if (etapaData?.checkboxes) {
  const checkboxesMarcados = etapaData.checkboxes.map(cb => ({
    ...cb,
    checked: true,
    checked_at: new Date().toISOString()
  }));
  await supabase
    .from('pedidos_etapas')
    .update({ checkboxes: checkboxesMarcados })
    .eq('pedido_id', pedidoId)
    .eq('etapa', 'aprovacao_ceo');
}

// Depois sim chama o avanco
await moverParaProximaEtapa.mutateAsync({ pedidoId, skipCheckboxValidation: true });
```

## Resultado

- Pedidos nao poderao mais pular a aprovacao CEO
- A pagina de aprovacoes da direcao continuara funcionando normalmente
- O avanco de outras etapas nao sera afetado
