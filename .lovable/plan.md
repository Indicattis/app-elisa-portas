
# Plano: Adicionar Botao para Resolver Problema de Linha na Sidebar de Ordens

## Objetivo

Adicionar um botao para resolver o problema de linhas marcadas com `com_problema` na sidebar lateral direita da pagina `/fabrica/ordens-pedidos` (componente `OrdemLinhasSheet`).

## Arquivo a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Adicionar mutation e botoes para resolver problemas |

## Mudancas Tecnicas

### 1. Adicionar Mutation para Resolver Problema

Adicionar uma mutation similar a que existe em `useOrdemProducao.ts`:

```typescript
const resolverProblema = useMutation({
  mutationFn: async (linhaId: string) => {
    const { error } = await supabase
      .from('linhas_ordens')
      .update({
        com_problema: false,
        problema_descricao: null,
        problema_reportado_em: null,
        problema_reportado_por: null,
      })
      .eq('id', linhaId);

    if (error) throw error;
    return linhaId;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
    queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
    toastHook({
      title: "Problema resolvido",
      description: "O item foi marcado como disponível.",
    });
  },
  onError: () => {
    toastHook({
      title: "Erro",
      description: "Não foi possível resolver o problema.",
      variant: "destructive",
    });
  },
});
```

### 2. Adicionar Botao no Alerta de Linhas com Problema

Na secao do alerta (linhas 304-318), adicionar um botao ao lado de cada linha com problema:

```tsx
{linhas.filter(l => l.com_problema).map(linha => (
  <div key={linha.id} className="flex items-center justify-between gap-2">
    <p className="text-sm text-white flex-1">
      • {linha.estoque?.nome_produto || linha.item} - Qtd: {linha.quantidade}
      {linha.tamanho && ` - Tam: ${linha.tamanho}`}
    </p>
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
      onClick={() => resolverProblema.mutate(linha.id)}
      disabled={resolverProblema.isPending}
      title="Resolver problema"
    >
      <CheckCircle2 className="h-4 w-4" />
    </Button>
  </div>
))}
```

### 3. Adicionar Indicador Visual nas Linhas da Lista

Na lista de linhas (linhas 420-478), adicionar indicador visual e botao para linhas com problema:

- Adicionar borda/fundo vermelho para linhas com `com_problema`
- Adicionar botao de resolver problema ao lado do botao de impressao
- Importar icone `CheckCircle2` do lucide-react

## Fluxo de Uso

1. Usuario abre a sidebar de uma ordem com linhas problemáticas
2. No alerta vermelho, ve as linhas com problema listadas
3. Clica no botao verde (check) ao lado da linha
4. Sistema limpa o flag `com_problema` e atualiza a interface
5. Linha volta ao estado normal e pode ser concluida

## Resultado Esperado

A sidebar em `/fabrica/ordens-pedidos` permitira:
- Visualizar claramente quais linhas tem problema (destacadas em vermelho)
- Resolver problemas diretamente com um clique
- Continuar o fluxo de producao sem precisar acessar outra interface
