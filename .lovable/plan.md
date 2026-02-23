

# Adicionar coluna Instalacoes e corrigir lucro zero em Portas/Pintura

## Problema 1: Lucro de Portas e Pintura sempre zero

O codigo usa os campos `lucro_produto` (para portas) e `lucro_pintura` (para pintura) da tabela `produtos_vendas`. Porem, no banco de dados, **ambos os campos estao zerados para todos os produtos**. Todo o lucro esta armazenado no campo `lucro_item`.

Dados reais de janeiro/2026:
- porta_enrolar: `lucro_produto` = 0, `lucro_item` = R$ 167.441
- pintura_epoxi: `lucro_pintura` = 0, `lucro_item` = R$ 28.785

**Solucao:** Usar `lucro_item` como campo de lucro para todos os tipos de produto.

## Problema 2: Coluna Instalacoes ausente

Os dados de instalacao estao na tabela `vendas` (campos `valor_instalacao` e `lucro_instalacao`), nao em `produtos_vendas`. Existem 40 vendas com instalacao em janeiro/2026:
- Faturamento: R$ 173.600
- Lucro: R$ 19.170

**Solucao:** Buscar `valor_instalacao` e `lucro_instalacao` da tabela `vendas` e exibir em coluna propria.

## Mudancas no arquivo `src/pages/direcao/DREMesDirecao.tsx`

### 1. Adicionar campo `instalacoes` na interface

```typescript
interface FaturamentoProduto {
  portas: number;
  pintura: number;
  acessorios: number;
  adicionais: number;
  instalacoes: number;
  total: number;
}
```

### 2. Corrigir campo de lucro para todos os tipos

Trocar de campos especificos para `lucro_item` em todos os casos:

```typescript
if (['porta_enrolar', 'porta_social'].includes(tipo)) {
  fat.portas += valorTotal;
  luc.portas += p.lucro_item || 0;  // era lucro_produto
} else if (tipo === 'pintura_epoxi') {
  fat.pintura += valorTotal;
  luc.pintura += p.lucro_item || 0;  // era lucro_pintura
} else if (tipo === 'acessorio') {
  ...
```

### 3. Buscar dados de instalacao da tabela `vendas`

Adicionar `valor_instalacao` e `lucro_instalacao` na query de vendas que ja busca `valor_credito`:

```typescript
const { data: vendas } = await supabase
  .from('vendas')
  .select('valor_credito, valor_instalacao, lucro_instalacao')
  .gte('data_venda', start + ' 00:00:00')
  .lte('data_venda', end + ' 23:59:59');

const totalCredito = ...;
const totalFatInstalacao = vendas?.reduce((sum, v) => sum + (v.valor_instalacao || 0), 0) || 0;
const totalLucroInstalacao = vendas?.reduce((sum, v) => sum + (v.lucro_instalacao || 0), 0) || 0;

fat.instalacoes = totalFatInstalacao;
luc.instalacoes = totalLucroInstalacao;
```

### 4. Adicionar coluna no array `columns`

```typescript
const columns = [
  { key: 'portas', label: 'Portas' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'instalacoes', label: 'Instalacoes' },
  { key: 'acessorios', label: 'Acessorios' },
  { key: 'adicionais', label: 'Adicionais' },
  { key: 'total', label: 'Total' },
] as const;
```

### 5. Incluir instalacoes no total

```typescript
fat.total = fat.portas + fat.pintura + fat.instalacoes + fat.acessorios + fat.adicionais + totalCredito;
luc.total = luc.portas + luc.pintura + luc.instalacoes + luc.acessorios + luc.adicionais;
```

## Resultado esperado

| | Portas | Pintura | Instalacoes | Acessorios | Adicionais | Total |
|---|---|---|---|---|---|---|
| Faturamento | R$ 893.469 | R$ 133.638 | R$ 173.600 | R$ 29.072 | R$ 62.662 | ~R$ 1.308.829 |
| Lucro | R$ 167.441 | R$ 28.785 | R$ 19.170 | R$ 9.104 | R$ 19.858 | ~R$ 244.360 |

