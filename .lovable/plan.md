

# Corrigir botao da Fabrica em /home para usuarios com acesso parcial

## Problema

Na pagina `/home`, o botao "Fabrica" verifica se o usuario tem acesso a rota `fabrica_hub`. Porem, usuarios que so possuem acesso a sub-rotas (como `fabrica_pedidos`) nao conseguem clicar no botao, pois `fabrica_hub` nao esta na lista de permissoes deles.

O mesmo problema se aplica aos demais modulos (Vendas, Logistica, etc.).

## Solucao

Alterar a logica de verificacao em `src/pages/Home.tsx` para considerar que o usuario tem acesso a um modulo se possuir acesso ao hub **OU** a qualquer sub-rota daquele modulo.

### Mudanca tecnica

**Arquivo: `src/pages/Home.tsx`**

1. Expandir o `routeKeyMap` com um prefixo por modulo (ex: `fabrica` para `/fabrica`).
2. Na query, buscar **todas** as permissoes do usuario (remover o filtro `.in('route_key', routeKeys)` restrito aos hubs).
3. Na funcao `hasAccess`, verificar se o usuario tem `fabrica_hub` **ou** qualquer `route_key` que comece com `fabrica_` (como `fabrica_pedidos`, `fabrica_producao`, etc.).

Exemplo da nova logica:

```text
routePrefixMap = {
  '/fabrica': 'fabrica_',
  '/vendas': 'vendas_',
  '/logistica': 'logistica_',
  ...
}

hasAccess('/fabrica'):
  - bypass? -> true
  - userAccess inclui 'fabrica_hub'? -> true
  - userAccess inclui alguma key que comeca com 'fabrica_'? -> true
  - senao -> false
```

Isso garante que qualquer usuario com pelo menos uma permissao dentro do modulo consiga acessar o hub correspondente.

## Arquivos modificados

1. **Editar**: `src/pages/Home.tsx` -- ajustar query e logica `hasAccess`

