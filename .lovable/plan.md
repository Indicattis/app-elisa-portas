

# Tooltip com Top 5 mais vendidos em Acessórios e Adicionais

## O que será feito

Nos headers "Acessórios" e "Adicionais" da tabela de Faturamento/Lucro, ao passar o mouse aparecerá um tooltip com os 5 itens mais vendidos (por quantidade) no mês, mostrando nome e quantidade.

## Alterações em `DREMesDirecao.tsx`

### 1. Buscar dados de ranking no `useEffect`

Dentro do `fetchData`, após processar os produtos, agrupar os itens de tipo `acessorio` e `adicional`/`manutencao` por `descricao` (ou buscar nome via `acessorio_id`/`adicional_id`), somar quantidades, ordenar e guardar os top 5 de cada em dois novos estados:

```typescript
const [topAcessorios, setTopAcessorios] = useState<{nome: string, qtd: number}[]>([]);
const [topAdicionais, setTopAdicionais] = useState<{nome: string, qtd: number}[]>([]);
```

A query de `produtos_vendas` precisa incluir `descricao, quantidade, acessorio_id, adicional_id` além dos campos já buscados. Com esses dados, agrupar por nome/descrição e pegar os 5 maiores.

### 2. Tooltip nos headers da tabela

Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de `@/components/ui/tooltip`. No `columns.map` do `<thead>`, para as colunas `acessorios` e `adicionais`, envolver o label com um `Tooltip` que mostra a listinha:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger className="cursor-default">
      {col.label}
    </TooltipTrigger>
    <TooltipContent>
      <p className="font-semibold mb-1">Top 5 mais vendidos</p>
      {topList.map((item, i) => (
        <p key={i} className="text-xs">{i+1}. {item.nome} ({item.qtd})</p>
      ))}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 3. Arquivos alterados
- `src/pages/direcao/DREMesDirecao.tsx` — adicionar estados, expandir query, adicionar tooltips nos headers

