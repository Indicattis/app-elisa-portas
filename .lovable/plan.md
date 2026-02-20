

# Adicionar Colunas com Checkbox para Fidelizado e Parceiro

## O que muda

Na tabela de clientes em `/direcao/vendas/clientes`, serao adicionadas duas novas colunas configuraveis com checkboxes interativos:

- Coluna com icone de estrela (Fidelizado): checkbox que marca/desmarca diretamente na tabela
- Coluna com icone de triangulo (Parceiro): checkbox que marca/desmarca diretamente na tabela

O usuario podera alterar o status clicando no checkbox sem precisar abrir o formulario de edicao.

## Alteracoes

### 1. `src/pages/direcao/ClientesDirecao.tsx`

- Importar o componente `Checkbox`
- Adicionar duas novas colunas no array `COLUNAS_DISPONIVEIS`:
  - `{ id: 'fidelizado', label: 'Fidelizado', defaultVisible: true }`
  - `{ id: 'parceiro', label: 'Parceiro', defaultVisible: true }`
- No `renderCell`, adicionar dois novos cases:
  - `fidelizado`: renderiza um `Checkbox` com icone de estrela, checked conforme `cliente.fidelizado`, ao clicar chama `updateCliente` com o valor invertido (com `e.stopPropagation()` para nao abrir o dialog de edicao)
  - `parceiro`: renderiza um `Checkbox` com icone de triangulo, checked conforme `cliente.parceiro`, ao clicar chama `updateCliente` com o valor invertido
- Atualizar `getColumnAlignment` para centralizar ambas colunas
- O `renderCell` precisa ter acesso a `updateCliente` (remover do `useCallback` com deps vazias ou adicionar a dependencia)

### 2. Logica do checkbox inline

Cada checkbox chamara `updateCliente` diretamente:

```text
onClick -> stopPropagation (evita abrir modal de edicao)
onCheckedChange -> updateCliente({ id: cliente.id, data: { fidelizado: !cliente.fidelizado } })
```

Os icones de estrela e triangulo que ja aparecem na coluna "Tag" continuarao la como indicadores visuais. As novas colunas permitem a edicao rapida.

### Nenhuma alteracao no backend

As colunas `fidelizado` e `parceiro` ja existem na tabela. O hook `useUpdateCliente` ja suporta atualizar esses campos.

