

# Simplificar indicadores e adicionar % de lucro

## Mudancas

### 1. Remover funcionalidade de expansao (clique)

**Arquivo: `src/pages/direcao/FaturamentoDirecao.tsx`**
- Remover o state `expandedIndicador`
- Remover o import de `IndicadorTable`
- Remover o bloco da tabela expandida (linhas 812-828)
- Remover o texto "(clique para expandir)" do titulo da secao (linha 770)
- Remover `vendasPorIndicador` e todo o useMemo associado
- Substituir `IndicadorExpandivel` por divs estaticas simples (sem onClick, sem chevrons)

### 2. Adicionar % de lucro em cada indicador

Para cada indicador que tem valor bruto e lucro, calcular a margem: `(lucro / valorBruto) * 100`. Exibir abaixo do lucro como texto pequeno (ex: "32.5%").

Os indicadores com margem serao: Portas, Pintura, Instalacoes, Acessorios, Adicionais. Fretes e Lucro Liquido nao tem margem individual. Para Lucro Liquido, calcular margem sobre o faturamento total.

### 3. Simplificar `IndicadorExpandivel.tsx`

Transformar o componente `IndicadorExpandivel` em um card estatico (div em vez de button), removendo:
- Props de expansao (`expanded`, `onToggle`, `vendas`, `visibleColumns`, `renderCell`, etc.)
- Icones de chevron
- Logica de clique

Adicionar nova prop `margemLucro` (string opcional) para exibir a porcentagem.

O componente `IndicadorTable` pode ser removido do arquivo ou mantido sem uso -- sera removido do import em `FaturamentoDirecao.tsx`.

## Detalhes tecnicos

**Calculo da margem:**
```
const margem = valorBruto > 0 ? ((lucro / valorBruto) * 100).toFixed(1) + '%' : '0%'
```

**Arquivos editados:**
- `src/pages/direcao/FaturamentoDirecao.tsx` -- remover expansao, adicionar margem
- `src/components/direcao/IndicadorExpandivel.tsx` -- simplificar para card estatico com margem

