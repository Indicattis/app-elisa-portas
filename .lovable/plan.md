

## Plano: Adicionar botão de Programação ao Checklist Liderança

### Resumo
Adicionar um botão "Programação" no header da página `/direcao/checklist-lideranca` que navega para `/dashboard/direcao/checklist/programacao`, permitindo configurar tarefas recorrentes diretamente a partir desta tela.

### Alteração em `src/pages/ChecklistLideranca.tsx`

No bloco do header (após o botão "Voltar", junto aos botões de ação), adicionar um botão:

```tsx
<Button 
  variant="outline" 
  size="sm"
  onClick={() => navigate('/dashboard/direcao/checklist/programacao')}
>
  <CalendarDays className="h-4 w-4 mr-2" />
  Programação
</Button>
```

O ícone `CalendarDays` já está importado no arquivo. O botão será posicionado ao lado dos botões existentes de "Nova Tarefa" e "Recorrentes".

### Arquivo impactado
- `src/pages/ChecklistLideranca.tsx`

