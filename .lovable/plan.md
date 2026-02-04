
# Plano: Corrigir Salvamento de Data de Venda com Datas Passadas

## Problema Identificado

O bug ocorre devido a um problema de **timezone** no JavaScript:

1. Usuario seleciona uma data (ex: 30/01/2026)
2. O Calendar retorna um objeto Date com a data local a meia-noite: `Jan 30, 2026 00:00:00 (UTC-3)`
3. Ao chamar `.toISOString()`, a data e convertida para UTC: `2026-01-29T21:00:00.000Z`
4. O banco salva **29 de janeiro** ao inves de **30 de janeiro**

Este e um problema conhecido neste projeto, conforme documentado na memoria sobre `date-parsing-standardization`.

## Solucao

Criar a string ISO de forma que preserve a data local selecionada, usando noon (12:00) UTC para evitar problemas de timezone:

```typescript
// De:
data_venda: dataVenda.toISOString()

// Para:
data_venda: `${format(dataVenda, 'yyyy-MM-dd')}T12:00:00.000Z`
```

Usando `format()` do date-fns, extraimos a data local (ano-mes-dia) e criamos uma string ISO com horario fixo em 12:00 UTC. Isso garante que independente do fuso horario do usuario, a data sera interpretada corretamente.

## Arquivos a Modificar

### 1. `src/pages/vendas/VendaNovaMinimalista.tsx`

Atualizar as duas chamadas de `createVenda` (linhas 442 e 471):

```typescript
// Linha 442 - Submissao normal
await createVenda({ 
  vendaData: {
    ...formData,
    forma_pagamento: pagamentoData.metodos[0]?.tipo || '',
    data_venda: `${format(dataVenda, 'yyyy-MM-dd')}T12:00:00.000Z`,
  },
  // ...
});

// Linha 471 - Submissao com autorizacao de desconto
await createVenda({ 
  vendaData: {
    ...formData,
    forma_pagamento: pagamentoData.metodos[0]?.tipo || '',
    data_venda: `${format(dataVenda, 'yyyy-MM-dd')}T12:00:00.000Z`,
  },
  // ...
});
```

### 2. `src/pages/VendaVinculacao.tsx`

Aplicar a mesma correcao na linha 118:

```typescript
// De:
data_venda: date.toISOString(),

// Para:
data_venda: `${format(date, 'yyyy-MM-dd')}T12:00:00.000Z`,
```

### 3. `src/pages/VendasNova.tsx` (se existir date picker)

Verificar e aplicar a mesma correcao se houver campo de data de venda.

## Exemplo Visual do Bug

| Acao | Antes (Bug) | Depois (Corrigido) |
|------|-------------|-------------------|
| Usuario seleciona 30/01/2026 | `2026-01-29T21:00:00.000Z` | `2026-01-30T12:00:00.000Z` |
| Data salva no banco | 29/01/2026 | 30/01/2026 |

## Detalhes Tecnicos

A funcao `format()` do date-fns ja e importada no arquivo (linha 21), entao nao e necessario adicionar novos imports.

O horario `12:00:00.000Z` (meio-dia UTC) foi escolhido porque:
- Evita problemas de mudanca de dia em qualquer fuso horario do mundo
- Mantem compatibilidade com o formato ISO 8601 esperado pelo banco
- E uma pratica padrao para armazenar "apenas datas" em timestamps

## Resultado Esperado

- Vendedores poderao cadastrar vendas com datas passadas corretamente
- A data selecionada no calendario sera exatamente a data salva no banco
- Nenhum impacto nas vendas existentes (apenas novas vendas)
