

## Plano: Sempre exibir seletor de responsável no modal de Nova Tarefa Recorrente

### Alteração em `src/components/todo/NovaRecorrenteModal.tsx`

- Remover a variável `podeEscolherResponsavel` e a condição que esconde o seletor
- Exibir o `Select` de responsável **sempre**, independente do role do usuário
- Atualizar a validação do `handleSubmit` para sempre exigir `responsavelId`
- Atualizar o `disabled` do botão de submit para sempre verificar `responsavelId`

### Arquivo impactado
- `src/components/todo/NovaRecorrenteModal.tsx`

