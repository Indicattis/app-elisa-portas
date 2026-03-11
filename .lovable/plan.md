

## Página dedicada para preencher vaga + campo "em teste/efetivado"

### Resumo

Ao clicar em "Preencher vaga" na página `/administrativo/rh-dp/vagas`, em vez de abrir um dialog, o usuário será navegado para uma nova página de cadastro (`/administrativo/rh-dp/vagas/preencher/:vagaId`) com função e setor pré-preenchidos e bloqueados. A página terá um campo novo: **Status de contratação** (efetivado / em teste). No organograma da direção, colaboradores "em teste" terão estilização azul diferenciada.

### Mudanças necessárias

#### 1. Adicionar coluna `em_teste` na tabela `admin_users`
- Nova coluna `em_teste boolean default false` na tabela `admin_users`.

#### 2. Criar página `src/pages/administrativo/rh-dp/PreencherVagaPage.tsx`
- Nova página de cadastro baseada no layout do `NovoColaborador.tsx`.
- Recebe o `vagaId` via URL params.
- Busca a vaga do banco para obter `cargo` e determinar o setor via `getSetorFromRole`.
- Campos `role` e `setor` vêm pré-preenchidos e **desabilitados** (não editáveis).
- Adiciona campo **"Status"** com Switch ou Select: "Em teste" / "Efetivado".
- Envia `em_teste: true|false` no body do `create-user`.
- Ao sucesso, marca a vaga como `preenchida` e navega de volta para `/administrativo/rh-dp/vagas`.

#### 3. Atualizar `VagasPage.tsx`
- Remover o `PreencherVagaDialog` e sua importação.
- No `handlePreencherClick`, usar `navigate(`/administrativo/rh-dp/vagas/preencher/${vaga.id}`)`.

#### 4. Registrar rota no `App.tsx`
- Adicionar rota: `/administrativo/rh-dp/vagas/preencher/:vagaId` → `PreencherVagaPage`.

#### 5. Atualizar edge function `create-user`
- Aceitar campo `em_teste` no body e salvá-lo no `admin_users`.

#### 6. Atualizar `useAllUsers` e tipo `User`
- Incluir `em_teste` no tipo `User` e no select da query.

#### 7. Estilização em `/direcao/gestao-colaboradores`
- No card do colaborador (`GestaoColaboradoresDirecao.tsx`), verificar `user.em_teste`.
- Se `em_teste === true`: borda azul (`border-blue-500/30`), avatar com fundo azul mais intenso, e badge "Em teste" azul no card.

### Arquivos editados
- `src/pages/administrativo/rh-dp/PreencherVagaPage.tsx` (novo)
- `src/pages/administrativo/VagasPage.tsx`
- `src/App.tsx`
- `src/hooks/useAllUsers.ts`
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx`
- Edge function `create-user`
- Migration SQL (coluna `em_teste`)

