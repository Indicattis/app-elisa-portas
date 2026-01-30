
# Plano: Adicionar Rota de Edição de Item do Estoque Fábrica

## Problema Identificado

A página `/estoque/fabrica` (EstoqueFabrica.tsx) navega para `/estoque/fabrica/editar-item/:id` ao dar duplo clique em um produto, mas essa rota não existe no App.tsx, causando o erro 404.

## Solução

Adicionar a rota `/estoque/fabrica/editar-item/:id` no App.tsx, usando o mesmo componente `EstoqueEditMinimalista` já utilizado em `/administrativo/compras/estoque/editar-item/:id`.

---

## Alterações Necessárias

### Arquivo: `src/App.tsx`

Adicionar nova rota após a linha 427 (rota `/estoque/fabrica`):

```typescript
<Route path="/estoque/fabrica/editar-item/:id" element={<ProtectedRoute routeKey="estoque_fabrica"><EstoqueEditMinimalista /></ProtectedRoute>} />
```

---

## Resultado

Antes:
```
/estoque/fabrica                    ✅ Funciona
/estoque/fabrica/editar-item/:id    ❌ 404 Error
```

Depois:
```
/estoque/fabrica                    ✅ Funciona
/estoque/fabrica/editar-item/:id    ✅ Funciona
```

---

## Resumo

| Arquivo | Linha | Ação |
|---------|-------|------|
| `src/App.tsx` | ~428 | Adicionar rota de edição |

A rota usará a mesma proteção (`estoque_fabrica`) e o mesmo componente de edição (`EstoqueEditMinimalista`) já existente no sistema.
