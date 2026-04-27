## Diagnóstico

A rota `/direcao/gestao-fabrica` em `src/App.tsx` (linha 459) está protegida com a `routeKey` errada:

```tsx
<Route path="/direcao/gestao-fabrica" element={
  <ProtectedRoute routeKey="direcao_hub">    {/* ← chave errada */}
    <GestaoFabricaDirecao />
  </ProtectedRoute>
} />
```

`direcao_hub` é a permissão da página principal `/direcao` (Hub da Direção). Já existe no banco a chave correta `direcao_gestao_fabrica` (cadastrada em `app_routes`), e o William **já tem essa permissão concedida** em `user_route_access`. Por isso a tela `/admin/permissions` mostra que ele tem acesso, mas o `ProtectedRoute` continua negando — porque está checando a permissão do hub, não a da página.

## Correção

Trocar a `routeKey` da rota `/direcao/gestao-fabrica` em `src/App.tsx` de `direcao_hub` para `direcao_gestao_fabrica`:

```tsx
<Route path="/direcao/gestao-fabrica" element={
  <ProtectedRoute routeKey="direcao_gestao_fabrica">
    <GestaoFabricaDirecao />
  </ProtectedRoute>
} />
```

## Verificação adicional

Vou também varrer rapidamente o `App.tsx` em busca de outras rotas `/direcao/*` que estejam usando `routeKey="direcao_hub"` indevidamente (mesmo padrão de bug). Se encontrar, corrijo cada uma para a `routeKey` específica correspondente já cadastrada em `app_routes` (ex.: `direcao_dre`, `direcao_faturamento`, `direcao_metas`, etc.). Caso a rota seja realmente o hub principal `/direcao`, mantenho `direcao_hub`.

## Resultado

Após a correção, o William (e qualquer outro usuário com `direcao_gestao_fabrica` concedido em `/admin/permissions`) conseguirá acessar `/direcao/gestao-fabrica` normalmente.
