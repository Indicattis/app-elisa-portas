

# Bloquear edição da linha de Pintura Epóxi

## Alteração

No arquivo `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`, na linha 822-834, a condição atual só bloqueia `porta_enrolar`. Vou adicionar `pintura_epoxi` à mesma condição:

```tsx
// De (linha 823):
{produto.tipo_produto === 'porta_enrolar' ? (

// Para:
{(produto.tipo_produto === 'porta_enrolar' || produto.tipo_produto === 'pintura_epoxi') ? (
```

E na badge de status (linha 814), incluir pintura_epoxi para mostrar label adequado:

```tsx
// De:
{produto.tipo_produto === 'porta_enrolar' ? 'Tabela' : 'Informado'}

// Para:
{produto.tipo_produto === 'porta_enrolar' ? 'Tabela' : produto.tipo_produto === 'pintura_epoxi' ? 'Fórmula' : 'Informado'}
```

## Arquivo
- `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` (linhas 814 e 823)

