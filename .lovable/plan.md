

# Correcao do bug de timezone nas datas de carregamento

## Problema

A data de carregamento `2026-02-21` (formato date-only) e interpretada pelo JavaScript como UTC midnight (`2026-02-21T00:00:00Z`). No fuso horario do Brasil (UTC-3), isso resulta em `2026-02-20T21:00:00`, fazendo com que a data seja exibida como **20/02** em vez de **21/02**.

A correcao ja existe no `CarregamentoDownbar.tsx` (linha 194) onde `'T12:00:00'` e concatenado, mas falta nos demais componentes.

## Alteracoes

### 1. `src/components/carregamento/CarregamentoKanban.tsx` (linha 108)

Corrigir a formatacao da data adicionando `T12:00:00` para forcar interpretacao ao meio-dia:

```
// DE:
format(new Date(ordem.data_carregamento), "dd/MM/yyyy", ...)
// PARA:
format(new Date(ordem.data_carregamento + 'T12:00:00'), "dd/MM/yyyy", ...)
```

### 2. `src/components/carregamento/OrdensCarregamentoSlimTable.tsx` (linha 119)

Mesma correcao:

```
// DE:
format(new Date(ordem.data_carregamento), "dd/MM/yyyy", ...)
// PARA:
format(new Date(ordem.data_carregamento + 'T12:00:00'), "dd/MM/yyyy", ...)
```

### 3. `src/pages/ProducaoCarregamento.tsx` e `src/pages/fabrica/producao/CarregamentoMinimalista.tsx` (ordenacao)

Corrigir o sort que tambem usa `new Date(a.data_carregamento)`:

```
// DE:
new Date(a.data_carregamento).getTime()
// PARA:
new Date(a.data_carregamento + 'T12:00:00').getTime()
```

### 4. `src/hooks/useOrdensCarregamentoUnificadas.ts` (linhas 376-378)

Corrigir a ordenacao no hook:

```
// DE:
new Date(a.data_carregamento).getTime()
// PARA:
new Date(a.data_carregamento + 'T12:00:00').getTime()
```

## Resumo

Sao 5 arquivos com a mesma correcao: concatenar `'T12:00:00'` ao interpretar `data_carregamento` como Date, evitando que o fuso UTC-3 desloque a data para o dia anterior. Padrao ja adotado no `CarregamentoDownbar.tsx`.

