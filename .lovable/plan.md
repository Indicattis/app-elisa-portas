
# Plano: Corrigir Rota e Navegação de Metas Individuais

## Problema Identificado

Ao clicar em um colaborador na página `/direcao/metas/fabrica`, o sistema navega para `/direcao/metas/{userId}`, mas essa rota **não está registrada** no App.tsx, resultando no erro "Page not found".

## Causa Raiz

A página `MetasColaboradorIndividual` já existe e está importada no App.tsx (linha 154), mas nunca foi adicionada como rota no roteador.

---

## Alterações Necessárias

### 1. Adicionar Rota no App.tsx

Registrar a rota `/direcao/metas/fabrica/:userId` para exibir métricas individuais do colaborador.

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionar rota `/direcao/metas/fabrica/:userId` apontando para `MetasColaboradorIndividual` |

```tsx
// Após linha 400:
<Route path="/direcao/metas/fabrica/:userId" element={<ProtectedRoute routeKey="direcao_hub"><MetasColaboradorIndividual /></ProtectedRoute>} />
```

### 2. Atualizar Navegação em MetasFabricaDirecao

Alterar o destino da navegação ao clicar em um colaborador.

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/direcao/MetasFabricaDirecao.tsx` | Mudar navegação de `/direcao/metas/${userId}` para `/direcao/metas/fabrica/${userId}` |

```tsx
// Linha 125:
onClick={() => navigate(`/direcao/metas/fabrica/${colaborador.user_id}`)}
```

### 3. Atualizar Retorno em MetasColaboradorIndividual

Ajustar os botões "Voltar" para retornar à página correta.

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/MetasColaboradorIndividual.tsx` | Mudar navegação de `/direcao/metas` para `/direcao/metas/fabrica` |

Linhas afetadas: 114 e 130

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/App.tsx` | Adicionar | Nova rota `/direcao/metas/fabrica/:userId` |
| `src/pages/direcao/MetasFabricaDirecao.tsx` | Editar | Atualizar path de navegação (linha 125) |
| `src/pages/MetasColaboradorIndividual.tsx` | Editar | Atualizar path de retorno (linhas 114 e 130) |

---

## Fluxo Após Correção

```text
/direcao/metas (Hub) 
    → /direcao/metas/fabrica (Lista colaboradores)
        → /direcao/metas/fabrica/:userId (Métricas individuais)
            ← Voltar → /direcao/metas/fabrica
```

---

## Impacto

- Correção imediata do erro 404
- Navegação consistente entre as páginas de metas
- Sem breaking changes em outras partes do sistema
