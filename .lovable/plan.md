

## Plano: Seção de usuários em teste + indicador vermelho nos setores

### Resumo
Separar os usuários `em_teste` em uma seção dedicada abaixo dos role groups de cada setor, adicionar botão para cadastrar novos usuários em teste, e exibir um badge vermelho nos setores que possuem usuários em teste.

### Mudanças em `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

1. **Separar usuários em teste** — No agrupamento (`grouped`), filtrar `em_teste !== true` para os cards normais. Criar uma lista separada `emTesteUsers` filtrando `em_teste === true` do setor atual.

2. **Seção "Em Teste"** — Abaixo do DndContext dos role groups, renderizar uma seção com título "Em Teste" (estilo vermelho/laranja), mostrando os cards dos usuários em teste agrupados. Incluir botão "+" para cadastrar novo usuário em teste.

3. **Botão de cadastro em teste** — Ao clicar, abrir o `PreencherVagaDialog` com uma flag `emTeste: true`. Isso requer:
   - Adicionar prop `emTeste?: boolean` ao `PreencherVagaDialog`
   - Passar `em_teste: true` no body da chamada à edge function `create-user` quando essa flag estiver ativa
   - Não vincular a nenhuma vaga (não chamar `updateVagaStatus`)

4. **Indicador vermelho nos setores** — Nos botões de setor (sidebar e mobile), calcular a quantidade de `em_teste` por setor. Se > 0, exibir um badge vermelho com o número ao lado do badge existente.

### Mudanças em `src/components/vagas/PreencherVagaDialog.tsx`

5. **Prop `emTeste`** — Adicionar prop opcional `emTeste?: boolean`. Quando true:
   - Título do dialog muda para "Cadastrar Usuário em Teste"
   - Enviar `em_teste: true` no body do `create-user`
   - Botão label: "Criar Usuário em Teste"

### Helper `getSetorEmTesteCount`

6. Nova função utilitária no componente para contar `em_teste` por setor:
```
const getSetorEmTesteCount = (setor) => {
  const roles = getRolesForSetor(setor);
  return (allUsers || []).filter(u => roles.includes(u.role) && u.em_teste).length;
}
```

Nenhuma migração SQL necessária — o campo `em_teste` já existe em `admin_users`.

