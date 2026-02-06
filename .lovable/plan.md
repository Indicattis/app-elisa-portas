

# Plano: Pagina de Gestao de Vagas (/administrativo/rh-dp/vagas)

## O que sera criado

Uma nova pagina para gerenciar vagas da empresa, seguindo o mesmo design da pagina de Colaboradores (`ColaboradoresMinimalista`), com funcionalidades de criar, aprovar, cancelar e preencher vagas. Ao clicar em "Preencher", abre o formulario de criacao de usuario (mesmo da pagina de colaboradores).

## Estrutura da Pagina

```text
+--------------------------------------------------+
| [<] Vagas                    [+ Nova Vaga]        |
|     Gestao de vagas da empresa                    |
+--------------------------------------------------+
| [Buscar por cargo...]  [Status: Todos v]          |
+--------------------------------------------------+
| Cargo     | Justificativa | Status    | Acoes     |
|-----------|---------------|-----------|-----------|
| Soldador  | Aumento dem.. | Em Analise| [v][x]    |
| Vendedor  | Substituicao  | Aberta    | [Preencher]|
| Pintor    | Nova vaga     | Preenchida| -         |
+--------------------------------------------------+
```

## Detalhes Tecnicos

### 1. Ativar botao no Hub (`RhDpHub.tsx`)

Alterar `ativo: false` para `ativo: true` na entrada "Vagas" do `menuItems`.

### 2. Adicionar rota no `App.tsx`

Adicionar a rota `/administrativo/rh-dp/vagas` apontando para o novo componente, com `ProtectedRoute` usando `routeKey="administrativo_hub"`.

### 3. Criar pagina `src/pages/administrativo/VagasPage.tsx`

Componente usando `MinimalistLayout` (mesmo padrao de `ColaboradoresMinimalista`):

- **Header**: Titulo "Vagas", subtitulo, botao "+ Nova Vaga" que abre dialog de criacao
- **Filtros**: Campo de busca por cargo + filtro por status (em_analise, aberta, fechada, preenchida)
- **Tabela**: Colunas - Cargo, Justificativa, Status (badge colorido), Data, Acoes
- **Acoes por status**:
  - `em_analise`: Botoes "Aprovar" (muda para `aberta`) e "Recusar" (muda para `fechada`)
  - `aberta`: Botao "Preencher" (abre dialog de criacao de usuario) e "Cancelar" (muda para `fechada`)
  - `preenchida` / `fechada`: Sem acoes (apenas visualizacao)
- **Dialog "Nova Vaga"**: Formulario com campos Cargo (select com roles do `system_roles`) e Justificativa (textarea)
- **Dialog "Preencher Vaga"**: Reutiliza a logica do `AddColaboradorDialog`, com o cargo pre-selecionado. Ao concluir, atualiza o status da vaga para `preenchida`

### 4. Hooks e dados utilizados

- `useVagas()` - hook existente para CRUD de vagas
- `system_roles` - query existente para popular selects de cargo
- `create-user` edge function - reutilizada para criar usuario ao preencher vaga

### 5. Badges de status

- `em_analise`: Amarelo (border-amber-500/30, text-amber-400)
- `aberta`: Verde (border-green-500/30, text-green-400)
- `fechada`: Vermelho (border-red-500/30, text-red-400)
- `preenchida`: Azul (border-blue-500/30, text-blue-400)

### Arquivos criados/modificados

1. **Criar**: `src/pages/administrativo/VagasPage.tsx` - Pagina principal
2. **Modificar**: `src/pages/administrativo/RhDpHub.tsx` - Ativar botao (linha 11: `ativo: true`)
3. **Modificar**: `src/App.tsx` - Adicionar rota

