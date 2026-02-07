
# Concluir ordens e delegar responsavel na sidebar de /fabrica/ordens-pedidos

## Resumo

Adicionar ao `OrdemLinhasSheet` (sidebar que abre ao clicar numa ordem) a capacidade de:
1. **Delegar um colaborador** como responsavel da ordem (quando nao tem responsavel)
2. **Concluir a ordem** apos marcar as linhas e ter um responsavel delegado

## Alteracoes

### 1. Editar: `src/components/fabrica/OrdemLinhasSheet.tsx`

**Adicionar delegacao de responsavel:**
- Importar `DelegacaoModal` e adicionar estado para controlar o modal
- Quando a ordem nao tem responsavel, exibir botao "Delegar Responsavel" na area de acoes
- Ao clicar, abre o `DelegacaoModal` (ja existente) para selecionar o colaborador
- Ao confirmar, faz update na tabela correspondente (usando `TABLE_MAP`) setando `responsavel_id` e `capturada_em`

**Adicionar botao "Concluir Ordem":**
- Botao fixo no rodape da sheet, visivel quando a ordem existe e nao esta concluida
- Ao clicar, executa a logica de conclusao:
  - Marca todas as linhas como concluidas
  - Atualiza o status da ordem para `concluido`
  - Registra `historico: true` e `data_conclusao`
  - Calcula `tempo_conclusao_segundos` baseado em `capturada_em`
  - Fecha a sheet
- Botao desabilitado se nao tem responsavel delegado

**Logica de conclusao (mutation no proprio componente):**
- Similar ao `concluirOrdem` de `useOrdemProducao.ts`, porem simplificada para uso pontual
- Atualiza `status: 'concluido'`, `historico: true`, `data_conclusao`, `tempo_conclusao_segundos`
- Marca linhas pendentes como concluidas
- Invalida queries `ordens-por-pedido`

### 2. Nenhum arquivo novo necessario

O `DelegacaoModal` ja existe em `src/components/production/DelegacaoModal.tsx` e sera reutilizado.

## Detalhes tecnicos

### Delegacao - mutation

```typescript
const delegarResponsavel = useMutation({
  mutationFn: async (userId: string) => {
    if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem invalida');
    const tableName = TABLE_MAP[ordem.tipo];
    const { error } = await supabase
      .from(tableName as any)
      .update({
        responsavel_id: userId,
        capturada_em: new Date().toISOString(),
      })
      .eq('id', ordem.id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
    queryClient.invalidateQueries({ queryKey: ['linhas-ordem'] });
    setShowDelegacaoModal(false);
    toast.success('Responsavel delegado com sucesso');
  },
});
```

### Conclusao - mutation

```typescript
const concluirOrdem = useMutation({
  mutationFn: async () => {
    if (!ordem?.id || !ordem?.tipo) throw new Error('Ordem invalida');
    const tableName = TABLE_MAP[ordem.tipo];

    // Calcular tempo de conclusao
    let tempo_conclusao_segundos = null;
    if (ordem.capturada_em) {
      tempo_conclusao_segundos = calcularTempoExpediente(
        new Date(ordem.capturada_em), new Date()
      ) + (ordem.tempo_acumulado_segundos || 0);
    }

    // Marcar todas linhas como concluidas
    await supabase
      .from('linhas_ordens')
      .update({ concluida: true, updated_at: new Date().toISOString() })
      .eq('ordem_id', ordem.id)
      .eq('tipo_ordem', ordem.tipo);

    // Concluir a ordem
    const { error } = await supabase
      .from(tableName as any)
      .update({
        status: 'concluido',
        historico: true,
        data_conclusao: new Date().toISOString(),
        tempo_conclusao_segundos,
      })
      .eq('id', ordem.id);

    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
    onOpenChange(false);
    toast.success('Ordem concluida com sucesso!');
  },
});
```

### UI na sheet

- Botao "Delegar Responsavel" ao lado do botao "Remover Responsavel" (exibido quando NAO tem responsavel)
- Botao "Concluir Ordem" grande e verde no final da lista de linhas, desabilitado se nao tem responsavel

## Arquivos modificados

1. **Editar**: `src/components/fabrica/OrdemLinhasSheet.tsx`
