

# Corrigir navegação do botão "Gerar Folha"

## Problema
O botão "Gerar Folha" em `ColaboradoresMinimalista.tsx` navega para `/dashboard/administrativo/rh/colaboradores/folha-pagamento` — uma rota que não existe no App.tsx. O padrão correto das rotas RH/DP é `/administrativo/rh-dp/...`.

## Solução

### 1. Adicionar rota da folha de pagamento no `src/App.tsx`
Após a linha 569, adicionar:
```tsx
<Route path="/administrativo/rh-dp/colaboradores/folha-pagamento" element={<ProtectedRoute routeKey="administrativo_hub"><FolhaPagamentoNova /></ProtectedRoute>} />
```

### 2. Corrigir o navigate em `src/pages/administrativo/ColaboradoresMinimalista.tsx`
Linha 187 — alterar de:
```tsx
onClick={() => navigate("/dashboard/administrativo/rh/colaboradores/folha-pagamento")}
```
Para:
```tsx
onClick={() => navigate("/administrativo/rh-dp/colaboradores/folha-pagamento")}
```

Dois arquivos afetados, duas linhas alteradas.

