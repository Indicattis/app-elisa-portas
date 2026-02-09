

# Corrigir acesso ao hub /fabrica para usuarios com permissoes parciais

## Problema

O usuario Magno tem permissao `fabrica_pedidos` mas nao tem `fabrica_hub`. Quando tenta acessar `/fabrica`, o `ProtectedRoute` verifica a chave `fabrica_hub` e bloqueia o acesso.

Na pagina `/home`, os botoes de modulos ja usam logica de prefixo (se o usuario tem qualquer `fabrica_*`, o botao aparece). Porem, ao clicar e ir para `/fabrica`, o `ProtectedRoute` exige `fabrica_hub` especificamente.

## Solucao

Existem duas opcoes:

**Opcao A - Banco de dados**: Inserir `fabrica_hub` no `user_route_access` para o Magno (e futuros usuarios com acesso parcial).

**Opcao B - Logica de prefixo no hub (recomendada)**: Criar uma nova prop no `ProtectedRoute` chamada `routeKeyPrefix` que verifica se o usuario tem **qualquer** permissao com aquele prefixo. Isso e consistente com a logica dos botoes na home.

A opcao B e mais sustentavel porque evita a necessidade de conceder manualmente `fabrica_hub` toda vez que alguem receber acesso a uma sub-rota.

## Alteracoes (Opcao B)

### 1. Criar hook `useRouteAccessByPrefix`
- Novo hook em `src/hooks/useRouteAccessByPrefix.ts`
- Consulta `user_route_access` filtrando por `route_key LIKE prefix%` e `can_access = true`
- Retorna `true` se existir pelo menos um registro

### 2. Atualizar `ProtectedRoute.tsx`
- Adicionar prop opcional `routeKeyPrefix?: string`
- Quando `routeKeyPrefix` for passado, usar o novo hook para verificar acesso por prefixo em vez de chave exata
- Manter compatibilidade total com a prop `routeKey` existente

### 3. Atualizar `App.tsx`
- Trocar o `routeKey="fabrica_hub"` da rota `/fabrica` por `routeKeyPrefix="fabrica_"`
- Aplicar a mesma logica para outros hubs que tenham o mesmo problema:
  - `/vendas` -> `routeKeyPrefix="vendas_"`
  - `/logistica` -> `routeKeyPrefix="logistica_"`
  - `/administrativo` -> `routeKeyPrefix="administrativo_"`
  - `/direcao` -> `routeKeyPrefix="direcao_"`
  - `/marketing` -> `routeKeyPrefix="marketing_"`

Dessa forma, qualquer usuario com pelo menos uma permissao dentro do modulo consegue acessar o hub correspondente.

### Arquivos

1. **Criar**: `src/hooks/useRouteAccessByPrefix.ts`
2. **Editar**: `src/components/ProtectedRoute.tsx` -- adicionar suporte a `routeKeyPrefix`
3. **Editar**: `src/App.tsx` -- trocar `routeKey` por `routeKeyPrefix` nas rotas de hub
