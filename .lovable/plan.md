

# Sincronizar conclusao de linhas entre /fabrica/ordens-pedidos e /producao/

## Problema

Quando linhas sao concluidas (individualmente ou em lote ao concluir a ordem) em `/fabrica/ordens-pedidos`, elas ja atualizam a tabela `linhas_ordens` no banco. Porem existem dois problemas:

1. **Conclusao em lote incompleta**: O botao "Concluir Ordem" marca `concluida: true` mas NAO registra `concluida_em` e `concluida_por`, campos que as downbars da producao usam para exibir o estado correto.
2. **Cache desatualizado**: As queries da producao (`ordens-producao`, `linhas-ordem`) nao sao invalidadas quando alteracoes sao feitas pelo painel administrativo.

## Solucao

### Arquivo: `src/components/fabrica/OrdemLinhasSheet.tsx`

**1. Corrigir a mutation `concluirOrdem` (linha 240-244)**

Adicionar `concluida_em` e `concluida_por` na atualizacao em lote das linhas, e invalidar as queries da producao.

De:
```typescript
await supabase
  .from('linhas_ordens')
  .update({ concluida: true, updated_at: new Date().toISOString() })
  .eq('ordem_id', ordem.id)
  .eq('tipo_ordem', ordem.tipo);
```

Para:
```typescript
const { data: { user } } = await supabase.auth.getUser();

await supabase
  .from('linhas_ordens')
  .update({
    concluida: true,
    concluida_em: new Date().toISOString(),
    concluida_por: user?.id || null,
    updated_at: new Date().toISOString(),
  })
  .eq('ordem_id', ordem.id)
  .eq('tipo_ordem', ordem.tipo)
  .eq('concluida', false);
```

**2. Invalidar queries da producao no `onSuccess` de `concluirOrdem` e `marcarLinha`**

Adicionar invalidacoes para que a producao atualize em tempo real:

```typescript
queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
queryClient.invalidateQueries({ queryKey: ['linhas-ordem'] });
```

Estas invalidacoes serao adicionadas tanto no `onSuccess` do `concluirOrdem` quanto no do `marcarLinha`.

## Arquivo modificado

1. **Editar**: `src/components/fabrica/OrdemLinhasSheet.tsx`
