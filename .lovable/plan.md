
# Plano: Correção do Carregamento de Produtos na Conferência

## Problema Identificado

A página de execução da conferência (`ConferenciaExecucao.tsx`) não está exibindo os itens de estoque, mesmo quando os dados existem no banco de dados. A investigação mostrou:

- Conferência `f4b21ee4-...` existe com **95 itens** no banco
- Os itens de conferência estão corretamente criados em `estoque_conferencia_itens`
- As políticas RLS permitem acesso para usuários autenticados
- Os dados da tabela `estoque` estão acessíveis

O problema parece ser uma condição de corrida (race condition) onde a página pode renderizar antes dos produtos serem carregados corretamente.

## Causa Raiz

No código atual (linha 218), a página aguarda apenas `loadingConferencia` e `loadingItens`, mas NÃO aguarda `loadingProdutos` no nível da página. Isso pode causar:

1. A página renderiza com spinner de conferência/itens
2. Quando esses carregam, a tabela é mostrada
3. Mas `produtos` pode ainda não ter dados (se o cache não foi populado)

## Solução

### 1. Incluir `loadingProdutos` na verificação inicial

Modificar a condição de loading inicial para incluir o carregamento de produtos:

```typescript
// Antes (linha 218)
if (loadingConferencia || loadingItens) {

// Depois
if (loadingConferencia || loadingItens || loadingProdutos) {
```

### 2. Adicionar mensagem quando não há produtos

Caso `produtos` retorne vazio (após carregado), exibir uma mensagem informativa em vez de tabela vazia:

```tsx
{!loadingProdutos && produtos.length === 0 ? (
  <Card>
    <CardContent className="py-8 text-center">
      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
      <p>Nenhum produto encontrado no estoque</p>
      <Button className="mt-4" onClick={() => window.location.reload()}>
        Recarregar página
      </Button>
    </CardContent>
  </Card>
) : (
  // Tabela existente...
)}
```

### 3. Forçar refetch dos produtos ao entrar na página

Adicionar invalidação do cache ao montar o componente para garantir dados frescos:

```typescript
const queryClient = useQueryClient();

useEffect(() => {
  // Invalidar cache de produtos ao entrar na página para garantir dados frescos
  queryClient.invalidateQueries({ queryKey: ["estoque-produtos"] });
}, [queryClient]);
```

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/estoque/ConferenciaExecucao.tsx` | Ajustar loading inicial, adicionar refetch e mensagem de fallback |

## Resultado Esperado

1. A página aguarda TODOS os dados necessários antes de exibir a tabela
2. Se não houver produtos, uma mensagem clara é exibida com opção de recarregar
3. O cache de produtos é invalidado ao entrar na página, garantindo dados frescos
