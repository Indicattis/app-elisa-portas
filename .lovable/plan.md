

## Plano: Modal de detalhes da missão ao clicar no card

### O que será feito
Ao clicar no card de uma missão, abrirá um modal exibindo todas as informações: título, responsável, todos os checkboxes (marcáveis), prazo de cada item, e para itens concluídos após o prazo, o tempo de atraso.

### Arquivos

**1. Novo: `src/components/todo/DetalhesMissaoModal.tsx`**
- Recebe a `Missao` selecionada, `open`, `onOpenChange`, `onToggleCheckbox`, `onDelete`
- Exibe título, responsável (avatar + nome), barra de progresso
- Lista todos os checkboxes com:
  - Checkbox marcável (chama `onToggleCheckbox`)
  - Descrição do item
  - Prazo formatado (dd/MM/yyyy)
  - Se concluído e tinha prazo: exibe data de conclusão (baseado em `updated_at` ou momento do toggle)
  - Se concluído após o prazo: badge vermelho com tempo de atraso (ex: "2 dias de atraso")
  - Se pendente e prazo vencido: badge "Atrasado"
- Botão "Excluir Missão" com AlertDialog de confirmação
- Estilo glassmorphism (bg-slate-900/95, border-white/10)

**2. Editar: `src/pages/ChecklistLideranca.tsx`**
- Adicionar state `missaoSelecionada` para controlar o modal
- No card da missão, adicionar `onClick={() => setMissaoSelecionada(missao)}`
- Renderizar `DetalhesMissaoModal` passando `toggleCheckbox` e `deletarMissao`

### Observação sobre data de conclusão
A tabela `missao_checkboxes` não possui coluna `concluida_em`. Para calcular atraso precisaremos compará-lo com o prazo. Duas opções:
1. Adicionar coluna `concluida_em` (timestamp) na tabela — permite cálculo preciso de atraso
2. Usar apenas indicação visual "Atrasado" / "No prazo" sem data exata

Recomendo a opção 1: adicionar coluna `concluida_em` via migration, e ao marcar checkbox, gravar a data atual.

### Migration SQL
```sql
ALTER TABLE public.missao_checkboxes ADD COLUMN concluida_em timestamptz;
```

### Alteração no hook `useMissoes.ts`
- No `toggleCheckbox`, ao marcar como concluída enviar `concluida_em: new Date().toISOString()`, ao desmarcar enviar `concluida_em: null`
- Atualizar interface `MissaoCheckbox` para incluir `concluida_em`

