

## Plano: Permitir edição de itens também na etapa "Aprovação CEO"

### Alterações

#### 1. `src/pages/administrativo/PedidosAdminMinimalista.tsx`
- Linha 363: mudar `readOnly={etapaConfig.id !== 'aberto'}` para `readOnly={etapaConfig.id !== 'aberto' && etapaConfig.id !== 'aprovacao_ceo'}`
- Linha 366: incluir `aprovacao_ceo` na condição de `onDeletar`

#### 2. `src/pages/PedidoView.tsx`
- Linha 631: mudar `isAberto` para incluir `aprovacao_ceo`:
  ```ts
  const isEditavel = pedido.etapa_atual === 'aberto' || pedido.etapa_atual === 'aprovacao_ceo';
  ```
- Substituir todas as referências a `isAberto` usadas para controle de edição (linhas ~1033, 1083, 1129, 1158) por `isEditavel`
- Manter `isAberto` se usado em outros contextos não relacionados à edição

#### 3. `src/pages/PedidoPreparacao.tsx`
- Linha 175: mudar para `const isReadOnly = pedido.etapa_atual !== 'aberto' && pedido.etapa_atual !== 'aprovacao_ceo';`

