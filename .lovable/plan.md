

# Pular Embalagem para pedidos apenas com separacao

## Problema
Pedidos que contem apenas itens de separacao (sem soldagem/perfiladeira) estao sendo direcionados para a etapa de Embalagem desnecessariamente. Esses pedidos devem ir diretamente para Expedicao Coleta ou Instalacoes, assim como ja pulam a Inspecao de Qualidade.

## Solucao
Alterar a logica de roteamento em `src/hooks/usePedidosEtapas.ts` para que, quando o pedido sai de `em_producao` e contem apenas separacao (sem pintura), ele va direto para `aguardando_coleta` ou `instalacoes` conforme o `tipo_entrega` da venda, pulando tanto a inspecao de qualidade quanto a embalagem.

## Alteracao

No bloco que trata `etapaAtualNome === 'em_producao'` (linhas 626-666), o trecho que atualmente direciona para `embalagem` quando nao tem pintura (linha 662) sera alterado para consultar o `tipo_entrega` e direcionar para `aguardando_coleta` ou `instalacoes`.

Logica atual (linha 660-663):
```
} else {
  etapaDestino = 'embalagem';
}
```

Nova logica:
```
} else {
  // Sem pintura e só separação → pular embalagem também
  const { data: vendaEntrega } = await supabase
    .from('vendas')
    .select('tipo_entrega')
    .eq('id', pedidoData.venda_id)
    .single();

  if (vendaEntrega?.tipo_entrega === 'entrega') {
    etapaDestino = 'aguardando_coleta';
  } else {
    etapaDestino = 'instalacoes';
  }
}
```

## Arquivo alterado
- `src/hooks/usePedidosEtapas.ts` - bloco de roteamento condicional ao sair de `em_producao`

## Impacto
- Pedidos apenas com separacao: `Em Producao` → `Expedicao Coleta` ou `Instalacoes` (pulando qualidade E embalagem)
- Pedidos com solda/perfiladeira continuam passando por qualidade e embalagem normalmente
- Pedidos com pintura continuam indo para aguardando_pintura → embalagem → coleta/instalacao
