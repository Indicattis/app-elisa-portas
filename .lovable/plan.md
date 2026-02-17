
# Adicionar rota de Equipes em /direcao/gestao-instalacao e funcionalidade de Gerente do Setor

## Resumo

1. Adicionar um botao "Equipes" no menu de `/direcao/gestao-instalacao` apontando para `/direcao/gestao-instalacao/equipes`
2. Criar uma nova pagina clone de `EquipesMinimalista` com breadcrumbs e back path ajustados para o contexto da direcao
3. Adicionar nessa pagina clone uma secao para definir o gerente do setor de instalacoes usando a tabela `setores_lideres`
4. Registrar a nova rota no `App.tsx`

## Detalhes tecnicos

### 1. Atualizar `GestaoInstalacaoDirecao.tsx`

Adicionar um novo item no array `menuItems`:

```typescript
{
  title: "Equipes",
  description: "Gestao de equipes de instalacao",
  icon: Users,
  path: "/direcao/gestao-instalacao/equipes",
}
```

Importar o icone `Users` de lucide-react.

### 2. Criar `src/pages/direcao/EquipesDirecao.tsx`

Clone de `EquipesMinimalista` com as seguintes diferencas:
- `backPath` alterado para `/direcao/gestao-instalacao`
- Breadcrumbs: Home > Direcao > Gestao de Instalacoes > Equipes
- Secao adicional no topo: **Gerente do Setor**

A secao de Gerente do Setor tera:
- Um card exibindo o gerente atual do setor "instalacoes" (buscado via `useSetoresLideres`)
- Um `Select` para escolher/alterar o gerente entre os usuarios ativos
- Botao para remover a atribuicao manual
- Usa `atribuirLider.mutate({ setor: "instalacoes", lider_id })` e `removerLider.mutate("instalacoes")`

### 3. Registrar rota em `App.tsx`

Adicionar junto das rotas de direcao:

```typescript
<Route path="/direcao/gestao-instalacao/equipes" element={<ProtectedRoute routeKey="direcao_hub"><EquipesDirecao /></ProtectedRoute>} />
```

Importar o componente `EquipesDirecao`.

### Arquivos modificados

- `src/pages/direcao/GestaoInstalacaoDirecao.tsx` - adicionar item de menu
- `src/pages/direcao/EquipesDirecao.tsx` - novo arquivo (clone com gerente do setor)
- `src/App.tsx` - adicionar rota e import
