

# Correcao: Botao de agendamento nao aparece para pedidos em Correcoes

## Problema

O pedido 0183 (aa1ecc83...) esta na etapa "correcoes" e possui um registro na tabela `correcoes` com `data_carregamento: null` e `carregamento_concluido: false`. O botao de agendar deveria aparecer, mas nao aparece.

## Causa raiz

No `PedidoCard.tsx`, a query `pedido-carregamento` (linha 374) tem um early return que so permite buscar dados para `aguardando_coleta` e `instalacoes`. Para qualquer outra etapa (incluindo `correcoes`), retorna `{ temData: true, concluido: false }`.

Como o botao de agendar (linha 1655) exige `!temDataCarregamento`, e `temData` esta sendo retornado como `true` artificialmente, o botao nunca aparece.

## Correcao (arquivo unico: `src/components/pedidos/PedidoCard.tsx`)

### Alterar a queryFn de carregamento (linhas 374-380)

Adicionar `correcoes` a condicao de passagem e incluir uma branch que busca dados da tabela `correcoes`:

```typescript
// Linha 374 - incluir correcoes na condicao
if (pedido.etapa_atual !== 'aguardando_coleta' 
    && pedido.etapa_atual !== 'instalacoes' 
    && pedido.etapa_atual !== 'correcoes') {
  return { concluido: false, temData: true, dataCarregamento: null };
}

// Nova branch para correcoes (antes da branch de instalacoes)
if (pedido.etapa_atual === 'correcoes') {
  const { data: correcao } = await supabase
    .from('correcoes')
    .select('data_carregamento, carregamento_concluido, responsavel_carregamento_nome, tipo_carregamento, vezes_agendado')
    .eq('pedido_id', pedido.id)
    .maybeSingle();

  const temData = !!correcao?.data_carregamento;
  const concluido = correcao?.carregamento_concluido || false;

  return {
    concluido,
    temData,
    dataCarregamento: correcao?.data_carregamento || null,
    responsavelNome: correcao?.responsavel_carregamento_nome || null,
    tipoCarregamento: correcao?.tipo_carregamento || null,
    vezesAgendado: correcao?.vezes_agendado || 0
  };
}
```

## Resultado esperado

- Pedido em "Correcoes" sem data de carregamento: `temData = false` -> botao de agendar aparece
- Pedido em "Correcoes" com carregamento agendado mas nao concluido: `temData = true, concluido = false` -> botao de agendar some, aguarda conclusao
- Pedido em "Correcoes" com carregamento concluido: `concluido = true` -> botao de avancar aparece

