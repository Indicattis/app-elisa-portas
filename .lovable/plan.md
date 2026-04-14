

## Plano: Criar vaga automaticamente ao desativar colaborador

### Problema
Ao desativar um colaborador em `/direcao/gestao-colaboradores`, ele simplesmente desaparece da lista sem deixar uma vaga aberta no lugar. O gestor perde a visibilidade da posição que precisa ser preenchida.

### Solução
Quando um colaborador for desativado, criar automaticamente uma vaga aberta com o cargo (role) desse colaborador, para que a posição continue visível como "vaga aberta" na interface.

### Alteração

**Arquivo: `src/pages/direcao/GestaoColaboradoresDirecao.tsx`** (linhas ~814-829)

No handler de desativação do colaborador, após o `update({ ativo: false })` bem-sucedido, chamar `createVaga` com o cargo do colaborador e uma justificativa automática indicando que o colaborador anterior foi desativado:

```
// Após desativar com sucesso:
await createVaga({
  cargo: userToDeactivate.role,
  justificativa: `Vaga aberta pela desativação de ${userToDeactivate.nome}`
});
```

Isso garante que a vaga aparece imediatamente na mesma posição/função onde o colaborador estava, permitindo ao gestor clicar para preencher com outra pessoa.

