

# Corrigir ordenacao de instalacoes - query com .maybeSingle() falhando

## Problema
Na etapa `instalacoes`, a busca de dados de carregamento usa `.maybeSingle()` (linha 329). Quando existem registros duplicados na tabela `instalacoes` para o mesmo `pedido_id`, o `.maybeSingle()` retorna erro/null, fazendo com que `_carregamento_data` e `_carregamento_concluido` fiquem como valores padrao (null/false). Isso classifica esses pedidos incorretamente como "Nao agendado", quebrando a ordenacao.

## Solucao

### Arquivo: `src/hooks/usePedidosEtapas.ts`

Substituir o `.maybeSingle()` na query de `instalacoes` (linhas 325-331) pelo padrao robusto ja utilizado em `correcoes` e documentado na arquitetura do projeto:

```typescript
} else if (etapa === 'instalacoes') {
  const { data: instArr } = await supabase
    .from('instalacoes')
    .select('data_carregamento, carregamento_concluido')
    .eq('pedido_id', pedido.id)
    .order('data_carregamento', { ascending: false, nullsFirst: false })
    .limit(1);
  const inst = instArr?.[0];
  _carregamento_data = inst?.data_carregamento || null;
  _carregamento_concluido = inst?.carregamento_concluido || false;
}
```

Tambem aplicar a mesma correcao na etapa `aguardando_coleta` (linhas 317-323) que usa o mesmo padrao problematico com `.maybeSingle()`.

