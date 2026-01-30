
# Plano: Remover Botão "Produção" da Home de Produção

## Problema

O card "Produção" está aparecendo na lista de painéis em `/producao/home`. Este card é desnecessário pois:
- O usuário já está na página de produção
- Clicar nele apenas redireciona para `/producao`, que é a mesma página

## Solução

Adicionar `producao_hub` ao filtro de rotas existente na linha 119.

## Alteração

### Arquivo: `src/pages/ProducaoHome.tsx`

**Linha 119 - Antes:**
```tsx
.filter(route => !['hub_fabrica_pedidos', 'metas'].includes(route.key))
```

**Linha 119 - Depois:**
```tsx
.filter(route => !['hub_fabrica_pedidos', 'metas', 'producao_hub'].includes(route.key))
```

## Resultado

O card "Produção" não aparecerá mais na lista de painéis, evitando redundância na interface.
