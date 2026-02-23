

# Corrigir calculo do faturamento total na pagina DRE mensal

## Problemas identificados

### 1. Descontos nao estao sendo considerados
O codigo atual soma os valores brutos (`valor_produto`, `valor_pintura`, `valor_instalacao`) que sao os valores de tabela. Porem, muitas vendas tem descontos aplicados (`desconto_valor`). O campo `valor_total_sem_frete` ja contem o valor correto apos descontos.

- Soma dos valores brutos: R$ 966.938
- Soma de `valor_total_sem_frete`: R$ 1.118.842,91

### 2. Creditos de vendas nao estao incluidos
O campo `valor_credito` da tabela `vendas` (R$ 16.387,00) nao e considerado no calculo. Essa e a mesma regra usada na pagina de overview: `valor_venda + valor_credito - valor_frete`.

- 1.118.842,91 + 16.387,00 = **1.135.229,91** (valor esperado)

### 3. Query de despesas falha (erro de formato de data)
A coluna `mes` na tabela `despesas_mensais` e do tipo `date`, mas o codigo filtra com `'2026-01'` (formato yyyy-MM). Precisa ser `'2026-01-01'` (formato yyyy-MM-dd).

## Solucao proposta

### Mudanca na logica de faturamento

Usar `valor_total_sem_frete` agrupado por `tipo_produto` para o breakdown:
- **Portas** = soma de `valor_total_sem_frete` onde tipo IN ('porta_enrolar', 'porta_social') -- ja inclui instalacao embutida apos desconto
- **Pintura** = soma de `valor_total_sem_frete` onde tipo = 'pintura_epoxi'
- **Acessorios** = soma de `valor_total_sem_frete` onde tipo = 'acessorio'
- **Adicionais** = soma de `valor_total_sem_frete` onde tipo IN ('adicional', 'manutencao')

Remover a coluna **Instalacoes** separada, pois apos desconto o valor de instalacao ja esta incorporado no `valor_total_sem_frete` da porta e nao pode ser separado com precisao.

Para o **Total**, somar todos os `valor_total_sem_frete` + `valor_credito` de cada venda do mes (buscado separadamente da tabela `vendas`).

### Mudanca na query de despesas

Alterar o filtro de:
```
.eq('mes', mes)        // mes = '2026-01' -> ERRO
```
Para:
```
.eq('mes', mes + '-01')  // mes = '2026-01-01' -> OK
```

## Detalhes tecnicos

**Arquivo:** `src/pages/direcao/DREMesDirecao.tsx`

**1. Adicionar `valor_total_sem_frete` ao select da query de produtos:**
```
valor_total_sem_frete,
```

**2. Remover coluna Instalacoes do interface e do array columns:**
- Interface `FaturamentoProduto`: remover campo `instalacoes`
- Array `columns`: remover entrada `{ key: 'instalacoes', label: 'Instalacoes' }`

**3. Alterar calculo do faturamento:**
```typescript
produtos?.forEach((p: any) => {
  const tipo = p.tipo_produto;
  const valorTotal = p.valor_total_sem_frete || 0;

  if (['porta_enrolar', 'porta_social'].includes(tipo)) {
    fat.portas += valorTotal;
    luc.portas += p.lucro_produto || 0;
  } else if (tipo === 'pintura_epoxi') {
    fat.pintura += valorTotal;
    luc.pintura += p.lucro_pintura || 0;
  } else if (tipo === 'acessorio') {
    fat.acessorios += valorTotal;
    luc.acessorios += p.lucro_item || 0;
  } else if (['adicional', 'manutencao'].includes(tipo)) {
    fat.adicionais += valorTotal;
    luc.adicionais += p.lucro_item || 0;
  }
});
```

**4. Buscar e somar valor_credito das vendas:**
```typescript
const { data: vendas } = await supabase
  .from('vendas')
  .select('valor_credito')
  .gte('data_venda', start + ' 00:00:00')
  .lte('data_venda', end + ' 23:59:59');

const totalCredito = vendas?.reduce((sum, v) => sum + (v.valor_credito || 0), 0) || 0;

fat.total = fat.portas + fat.pintura + fat.acessorios + fat.adicionais + totalCredito;
```

**5. Corrigir filtro de despesas:**
```typescript
.eq('mes', mes + '-01')
```

