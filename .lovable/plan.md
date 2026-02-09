
# Adicionar botao "Resetar Ordem" na sidebar de /fabrica/ordens-pedidos

## O que sera feito

Adicionar um botao "Resetar Ordem" na sidebar (OrdemLinhasSheet) que, ao ser clicado, exibe um modal de confirmacao e executa as seguintes acoes:

1. Define o status da ordem como `pendente`
2. Remove o responsavel (`responsavel_id: null`, `capturada_em: null`)
3. Reseta campos de conclusao/pausa (`data_conclusao: null`, `historico: false`, `pausada: false`, `justificativa_pausa: null`, `tempo_acumulado_segundos: 0`)
4. Marca todas as linhas da ordem como nao concluidas (`concluida: false`, `concluida_em: null`, `concluida_por: null`)

## Detalhe tecnico

### Arquivo: `src/components/fabrica/OrdemLinhasSheet.tsx`

**1. Adicionar icone `RotateCcw` ao import do lucide-react (linha 6)**

Adicionar `RotateCcw` a lista de icones importados.

**2. Adicionar estado para o modal de reset (apos linha 66)**

```typescript
const [showResetModal, setShowResetModal] = useState(false);
```

**3. Adicionar mutation `resetarOrdem` (apos a mutation `concluirOrdem`, ~linha 283)**

```typescript
const resetarOrdem = useMutation({
  mutationFn: async () => {
    if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem invalida');
    const tableName = TABLE_MAP[ordem.tipo];

    // Resetar todas as linhas
    await supabase
      .from('linhas_ordens')
      .update({
        concluida: false,
        concluida_em: null,
        concluida_por: null,
      })
      .eq('ordem_id', ordem.id)
      .eq('tipo_ordem', ordem.tipo);

    // Resetar a ordem
    const { error } = await supabase
      .from(tableName as any)
      .update({
        status: 'pendente',
        responsavel_id: null,
        capturada_em: null,
        data_conclusao: null,
        historico: false,
        pausada: false,
        justificativa_pausa: null,
        tempo_acumulado_segundos: 0,
      })
      .eq('id', ordem.id);

    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
    queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
    queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
    setShowResetModal(false);
    onOpenChange(false);
    toast.success('Ordem resetada com sucesso');
  },
  onError: () => {
    toastHook({
      title: "Erro",
      description: "Nao foi possivel resetar a ordem.",
      variant: "destructive",
    });
  },
});
```

**4. Adicionar botao "Resetar Ordem" na area de acoes (~linha 509, antes do fechamento do TooltipProvider)**

Exibir o botao quando a ordem nao estiver pendente (`ordem?.status !== 'pendente'`):

```typescript
{ordem && ordem.status !== 'pendente' && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowResetModal(true)}
        disabled={resetarOrdem.isPending}
        className="h-8 gap-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-300"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="text-xs">Resetar</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      Resetar ordem para pendente, remover responsavel e desmarcar linhas
    </TooltipContent>
  </Tooltip>
)}
```

**5. Adicionar modal de confirmacao (apos o DelegacaoModal, ~linha 653)**

Reutilizar o componente `AlertDialog` para confirmar a acao:

```typescript
<AlertDialog open={showResetModal} onOpenChange={setShowResetModal}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Resetar ordem</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza? A ordem voltara ao status "pendente", todas as linhas serao
        desmarcadas e o responsavel sera removido.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={resetarOrdem.isPending}>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={(e) => { e.preventDefault(); resetarOrdem.mutate(); }}
        disabled={resetarOrdem.isPending}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {resetarOrdem.isPending ? "Resetando..." : "Resetar"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Imports adicionais necessarios

Adicionar ao topo do arquivo:
- `RotateCcw` do lucide-react
- `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` do alert-dialog

## Arquivo modificado

1. **Editar**: `src/components/fabrica/OrdemLinhasSheet.tsx`
