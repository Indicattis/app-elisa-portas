

## Plano: Modal de histórico ao clicar no card da tarefa recorrente

### O que será feito
Ao clicar no card de um template na programação semanal, abrirá um modal mostrando:
1. Informações do template (descrição, responsável, dias da semana, horário)
2. Histórico das últimas 7 tarefas geradas por esse template
3. Botão para excluir a tarefa recorrente (e todas as futuras)

### Arquivos

**1. Novo componente: `src/components/todo/HistoricoRecorrenteModal.tsx`**
- Modal (Dialog) recebendo o `TarefaTemplate` selecionado
- Consulta ao Supabase: buscar as últimas 7 tarefas da tabela `tarefas` onde `template_id = template.id`, ordenadas por `data_referencia` desc, limit 7
- Exibe cada tarefa com: data, status (concluída/pendente/não concluída), ícone e badge correspondente
- Botão "Excluir tarefa recorrente" com confirmação (AlertDialog) que chama `onDelete`
- Estilo glassmorphism consistente com o restante da página

**2. Alteração: `src/pages/ChecklistLideranca.tsx`**
- Adicionar state `templateSelecionado` para controlar qual template foi clicado
- No card do template (linha ~245), adicionar `onClick` para abrir o modal com o template clicado
- Renderizar o novo `HistoricoRecorrenteModal`
- Passar `deletarTemplate.mutate` como callback de exclusão

### Detalhes técnicos
- Query Supabase: `supabase.from('tarefas').select('*, responsavel:admin_users!tarefas_responsavel_id_fkey(nome, foto_perfil_url)').eq('template_id', templateId).order('data_referencia', { ascending: false }).limit(7)`
- Usar `useQuery` com `enabled: !!template` para buscar apenas quando o modal estiver aberto
- Status visual: verde (concluída), vermelho (não concluída com data passada), amarelo (pendente)

