

## Plano: Permitir preencher vagas diretamente do organograma

### Resumo
Tornar os cards de "Vaga aberta" clicáveis no organograma, abrindo o `PreencherVagaDialog` já existente para cadastrar um novo colaborador diretamente na vaga. Ao concluir, a vaga é marcada como `preenchida`.

### Mudanças

**`src/pages/direcao/GestaoColaboradoresDirecao.tsx`**

1. **Importar** `PreencherVagaDialog` de `@/components/vagas/PreencherVagaDialog`

2. **Adicionar estados** para controlar o dialog:
   - `preencherVagaOpen: boolean`
   - `vagaToFill: Vaga | null` (para saber qual vaga está sendo preenchida)

3. **No card de vaga aberta** (linhas 236-255) — adicionar onClick no card ou um botão "Preencher" que abre o dialog com `defaultRole` = `vaga.cargo`

4. **Callback `onSuccess`** do dialog:
   - Atualizar status da vaga para `preenchida` via `updateVagaStatus(vagaToFill.id, 'preenchida')`
   - Invalidar queries `all-users` para refletir o novo colaborador

5. **Renderizar** `<PreencherVagaDialog>` no componente principal com os estados acima

6. **Propagar** `onCancelVaga` e o novo `onFillVaga` para o `SortableRoleGroup` via props

Nenhuma migração SQL necessária.

