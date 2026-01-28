
# Plano: Corrigir Validação da Senha Master

## Problema Identificado

A senha master "querodesconto" está configurada corretamente no banco de dados, mas o sistema reporta "Senha incorreta" ao tentar autorizar um desconto.

**Causa raiz provável**: O React Query está usando dados cacheados (stale) quando o modal de autorização é aberto. Se a senha foi atualizada recentemente em `/direcao/vendas/regras-vendas`, o cache pode ainda conter a senha antiga.

## Evidências

| Verificacao | Resultado |
|-------------|-----------|
| Senha no banco | `querodesconto` (13 caracteres) |
| Match direto SQL | `true` |
| Ultima atualização | 20:12:10 UTC |

## Solucao

### 1. Forcar dados frescos no hook `useConfiguracoesVendas`

**Arquivo**: `src/hooks/useConfiguracoesVendas.ts`

Adicionar opcoes ao `useQuery` para garantir que os dados sejam sempre atualizados:

```typescript
const { data: configuracoes, isLoading, error } = useQuery({
  queryKey: ["configuracoes-vendas"],
  queryFn: async () => {
    // ... query existente
  },
  staleTime: 0, // Dados sempre considerados "stale" - força revalidação
  refetchOnMount: 'always', // Recarrega dados toda vez que o componente monta
});
```

### 2. Adicionar refetch no modal antes de validar

**Arquivo**: `src/components/vendas/AutorizacaoDescontoModal.tsx`

Modificar para buscar dados frescos quando o modal abre:

```typescript
const { configuracoes, isLoading: loadingConfig, limites, refetch } = useConfiguracoesVendas();

useEffect(() => {
  if (open) {
    // Forçar recarregamento das configurações quando modal abre
    refetch();
    setSenha('');
    setErro('');
    // ... resto do código
  }
}, [open, refetch, ...]);
```

### 3. Expor função refetch no hook

**Arquivo**: `src/hooks/useConfiguracoesVendas.ts`

Adicionar `refetch` ao retorno do hook:

```typescript
return {
  configuracoes,
  isLoading,
  error,
  limites,
  updateConfiguracoes: updateMutation.mutate,
  isUpdating: updateMutation.isPending,
  verificarSenhaResponsavel,
  verificarSenhaMaster,
  refetch, // Adicionar
};
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useConfiguracoesVendas.ts` | Adicionar `staleTime: 0`, `refetchOnMount: 'always'` e expor `refetch` |
| `src/components/vendas/AutorizacaoDescontoModal.tsx` | Chamar `refetch()` quando modal abre |

---

## Resultado Esperado

Apos a implementacao:
1. O modal de autorizacao sempre buscara dados frescos do banco
2. A senha master sera validada contra o valor atual no banco
3. Nao havera mais problemas de dados desatualizados em cache
