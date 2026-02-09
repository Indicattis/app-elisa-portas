

# Adicionar pagina "Responsabilidades" ao hub RH/DP

## Resumo

Adicionar um novo botao "Responsabilidades" no hub `/administrativo/rh-dp` e criar a pagina `/administrativo/rh-dp/responsabilidades` onde o usuario podera cadastrar funcoes, obrigacoes e responsabilidades de cada colaborador.

## Etapas

### 1. Criar tabela no banco de dados

Criar a tabela `colaborador_responsabilidades` para armazenar os registros:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| colaborador_id | uuid (FK -> admin_users.id) | Colaborador associado |
| titulo | text | Titulo da funcao/responsabilidade |
| descricao | text | Descricao detalhada |
| tipo | text | Tipo: "funcao", "obrigacao" ou "responsabilidade" |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

Politicas RLS para usuarios autenticados com roles admin/administrador.

### 2. Adicionar botao no hub RH/DP

No arquivo `src/pages/administrativo/RhDpHub.tsx`:
- Importar o icone `ClipboardList` do lucide-react
- Adicionar item ao array `menuItems`:
  ```
  { label: "Responsabilidades", icon: ClipboardList, path: "/administrativo/rh-dp/responsabilidades", ativo: true }
  ```
- Atualizar o grid desktop de `grid-cols-2` para `grid-cols-3` para acomodar 3 botoes

### 3. Criar a pagina de Responsabilidades

Criar `src/pages/administrativo/ResponsabilidadesPage.tsx` seguindo o mesmo padrao visual das demais paginas (fundo preto, glassmorphism, breadcrumb, botao voltar). A pagina tera:

- **Seletor de colaborador**: dropdown para escolher o colaborador (usando dados de `admin_users` com `eh_colaborador = true`)
- **Lista de responsabilidades**: cards mostrando as funcoes/obrigacoes/responsabilidades do colaborador selecionado, agrupadas por tipo
- **Botao adicionar**: abre um modal/dialog para cadastrar novo registro com campos: titulo, descricao, tipo (funcao/obrigacao/responsabilidade)
- **Acoes por item**: editar e excluir cada registro

### 4. Registrar rota no App.tsx

Adicionar a rota protegida:
```
<Route path="/administrativo/rh-dp/responsabilidades" element={<ProtectedRoute routeKey="administrativo_hub"><ResponsabilidadesPage /></ProtectedRoute>} />
```

## Arquivos envolvidos

1. **Criar tabela**: migration SQL para `colaborador_responsabilidades` com RLS
2. **Editar**: `src/pages/administrativo/RhDpHub.tsx` -- novo item no menu + grid 3 colunas
3. **Criar**: `src/pages/administrativo/ResponsabilidadesPage.tsx` -- pagina completa
4. **Editar**: `src/App.tsx` -- import + rota

