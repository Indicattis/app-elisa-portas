

## Plano: Excluir rota /logistica/pagamentos-autorizados

### Alterações

1. **Deletar** `src/pages/logistica/AcordosAutorizados.tsx`

2. **`src/App.tsx`**: Remover o import de `AcordosAutorizados` (linha 287) e a Route `/logistica/pagamentos-autorizados` (linha 560)

3. **`src/pages/logistica/LogisticaHub.tsx`**: Remover o item "Pagamentos Autorizados" do array de menu (linha 16) e o import `DollarSign` se não usado em outro lugar

O hook `useAcordosAutorizados` e o componente `NovoAcordoDialog` continuam usados por `AutorizadosPrecosDirecao.tsx` e `AprovacoesAutorizados.tsx`, então são mantidos.

