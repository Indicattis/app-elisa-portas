

## Plano: Criar vagas e seção de usuários em teste na página de Vagas

### 1. Criar Vagas

Adicionar um botão "Nova Vaga" no topo da área de conteúdo (ou na sidebar). Ao clicar, abre um Dialog simples com:
- Select de **Cargo** (lista de roles do setor selecionado, usando `systemRoles`)
- Textarea de **Justificativa**
- Botão "Criar Vaga" que chama `createVaga({ cargo, justificativa })` do hook `useVagas` já existente

**Estados novos:** `criarVagaOpen: boolean`

### 2. Seção "Em Teste"

Replicar o padrão do organograma (`GestaoColaboradoresDirecao.tsx`):

- Filtrar `filteredUsers` separando `em_teste === true` dos cards normais (linha 79: adicionar `&& u.em_teste !== true`)
- Criar lista `emTesteUsers = filteredUsers.filter(u => u.em_teste === true)`
- Abaixo dos role groups, renderizar seção "Em Teste" com:
  - Título vermelho + badge com contagem
  - Botão "+" para cadastrar usuário em teste (abre `PreencherVagaDialog` com `emTeste={true}`)
  - Grid dos cards de usuários em teste (com botões desativar/transferir como os normais)
- Adicionar badge vermelho nos botões de setor (sidebar e mobile) mostrando quantidade de em_teste

**Imports novos:** `PreencherVagaDialog` de `@/components/vagas/PreencherVagaDialog`

**Estados novos:** `preencherEmTesteOpen: boolean`, `criarVagaOpen: boolean`

### Mudanças

Arquivo único: `src/pages/administrativo/VagasPage.tsx`

Nenhuma migração SQL necessária.

