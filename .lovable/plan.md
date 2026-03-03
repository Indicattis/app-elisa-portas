
# Adicionar seção de Valor de Estoque abaixo das Despesas Projetadas

## O que será feito

Adicionar uma pequena seção no painel lateral direito, logo abaixo de "Despesas Projetadas do Ano", mostrando o valor total do estoque (quantidade × custo_unitário) e o total de itens. Os dados serão buscados da tabela `estoque` com uma nova query no `useEffect`/`fetchData`.

## Alterações em `DREMesDirecao.tsx`

### 1. Novo estado
```typescript
const [estoqueResumo, setEstoqueResumo] = useState({ valorTotal: 0, totalItens: 0 });
```

### 2. Buscar dados no `fetchData`
Adicionar query à tabela `estoque` (ativo=true), selecionar `quantidade, custo_unitario`, calcular o valor total e total de itens.

### 3. Nova seção no painel lateral (após linha 566, antes do fechamento da div)
Renderizar um bloco com título "Estoque" e duas linhas: Total de Itens e Valor Total, no mesmo estilo visual do painel existente (bg-white/5, border-white/10).

## Arquivo alterado
- `src/pages/direcao/DREMesDirecao.tsx`
