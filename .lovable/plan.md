

# Corrigir verificação de carregamento no PedidoCard

## Problema

Pedidos na etapa `correcoes` não mostram o botão "Avançar" mesmo com carregamento concluído, porque o código verifica **apenas a tabela `correcoes`** para essa etapa. Porém, o carregamento foi marcado como concluído na tabela `instalacoes` (de uma etapa anterior).

Dados confirmados no banco:
- Pedidos 0223, 0140, 0089, 0088, 0087, 0183 → etapa `correcoes`, `correcoes.carregamento_concluido = false`, mas `instalacoes.carregamento_concluido = true`
- Pedido 0200 → etapa `correcoes`, `correcoes.carregamento_concluido = false`, mas `ordens_carregamento.carregamento_concluido = true`

## Solução

Alterar a query `pedido-carregamento` em `PedidoCard.tsx` (linhas 388-465) para consultar **todas as três tabelas** (`ordens_carregamento`, `instalacoes`, `correcoes`) em paralelo para qualquer etapa logística, e considerar concluído se **qualquer** fonte tiver `carregamento_concluido = true`. Isso é consistente com a regra de integridade já aplicada em outras partes do sistema (ex: verificação no avanço de etapa, linhas ~1067-1069).

### Alteração em `src/components/pedidos/PedidoCard.tsx`

Substituir a lógica condicional por etapa (linhas 390-464) por consultas paralelas:

```typescript
queryFn: async () => {
  if (!['aguardando_coleta', 'instalacoes', 'correcoes', 'finalizado'].includes(pedido.etapa_atual)) {
    return { concluido: false, temData: true, dataCarregamento: null, ... };
  }

  // Consultar as 3 fontes em paralelo
  const [ordensRes, instRes, corrRes] = await Promise.all([
    supabase.from('ordens_carregamento').select('...').eq('pedido_id', pedido.id).order(...).limit(1),
    supabase.from('instalacoes').select('...').eq('pedido_id', pedido.id).order(...).limit(1),
    supabase.from('correcoes').select('...').eq('pedido_id', pedido.id).order(...).limit(1),
  ]);

  const todasFontes = [ordensRes.data?.[0], instRes.data?.[0], corrRes.data?.[0]].filter(Boolean);
  const concluido = todasFontes.some(f => f.carregamento_concluido);

  // Para dados de exibição (data, responsável), priorizar a fonte da etapa atual,
  // com fallback para qualquer fonte que tenha dados
  const fontePrioritaria = /* fonte da etapa atual */ || todasFontes.find(f => f.carregamento_concluido) || todasFontes[0];

  return {
    concluido,
    temData: !!fontePrioritaria?.data_carregamento,
    dataCarregamento: fontePrioritaria?.data_carregamento || null,
    responsavelNome: fontePrioritaria?.responsavel_carregamento_nome || null,
    tipoCarregamento: fontePrioritaria?.tipo_carregamento || null,
    vezesAgendado: fontePrioritaria?.vezes_agendado || 0
  };
}
```

### Arquivo alterado
- `src/components/pedidos/PedidoCard.tsx`

