
# Corrigir indicadores de faturamento em /direcao/faturamento

## Problema

Os indicadores do periodo mostram apenas Portas, Pintura e Instalacoes, mas nao incluem Acessorios, Adicionais, Manutencao e Porta Social. A soma das categorias (R$ 900.800) nao bate com o faturamento total (R$ 1.134.729,91) porque faltam ~R$ 234.000 dessas categorias ausentes.

Tipos de produto existentes no banco:
- `porta_enrolar` (maior volume)
- `adicional` (R$ 93.780 em valor_produto)
- `acessorio` (R$ 71.300)
- `porta_social` (R$ 32.510)
- `manutencao` (R$ 18.803)
- `pintura_epoxi` (valor em valor_pintura, nao valor_produto)

## Solucao

Adicionar dois novos indicadores na grid e ajustar o calculo de Portas para incluir `porta_social`.

### Alteracoes no arquivo `src/pages/direcao/FaturamentoDirecao.tsx`

**1. No `useMemo` dos indicadores (linhas 394-458):**

- Incluir `porta_social` no filtro de portas (junto com `porta` e `porta_enrolar`)
- Adicionar calculo de `valorBrutoAcessorios`: soma de `valor_produto` para tipos `acessorio`
- Adicionar calculo de `valorBrutoAdicionais`: soma de `valor_produto` para tipos `adicional` e `manutencao`
- Adicionar calculo de lucro para acessorios e adicionais (das vendas faturadas)

**2. Na grid de indicadores (linhas 726-790):**

- Adicionar card "Acessorios" com icone e valores
- Adicionar card "Adicionais" com icone e valores (incluindo manutencao)
- Ajustar grid de `lg:grid-cols-6` para `lg:grid-cols-8` para acomodar os novos cards

### Detalhes tecnicos

Novos campos no objeto `indicadores`:

```typescript
// Acessorios
valorBrutoAcessorios: filteredVendas.reduce((acc, v) => {
  const portas = v.portas || [];
  return acc + portas
    .filter((p: any) => p.tipo_produto === 'acessorio')
    .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
}, 0),

// Adicionais + Manutencao
valorBrutoAdicionais: filteredVendas.reduce((acc, v) => {
  const portas = v.portas || [];
  return acc + portas
    .filter((p: any) => ['adicional', 'manutencao'].includes(p.tipo_produto))
    .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
}, 0),
```

Incluir `porta_social` no filtro de portas:
```typescript
.filter((p: any) => ['porta', 'porta_enrolar', 'porta_social'].includes(p.tipo_produto))
```

### Arquivo editado
1. `src/pages/direcao/FaturamentoDirecao.tsx`
