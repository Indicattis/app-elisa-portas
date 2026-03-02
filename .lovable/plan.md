

# Adicionar logs de debug na verificacao de carregamento

## Diagnostico

Os dados no banco estao corretos:
- `instalacoes`: `carregamento_concluido = true`, `data_carregamento = 2026-02-27`
- `ordens_carregamento`: `carregamento_concluido = false`, `data_carregamento = null`

A logica no codigo tambem parece correta - consulta as 3 tabelas em paralelo e usa `.some()` para verificar se alguma tem dados. O erro nao deveria ocorrer com estes dados.

## Hipotese

O build pode nao ter atualizado corretamente, ou ha um problema sutil com a resposta do Supabase client (ex: RLS filtrando resultados no contexto do usuario logado vs admin).

## Acao

Adicionar `console.log` temporarios no `src/hooks/usePedidosEtapas.ts` dentro do bloco de verificacao (linhas 597-621) para registrar:

1. O `pedidoId` sendo verificado
2. O resultado bruto de cada consulta (`ordensRes.data`, `instRes.data`, `corrRes.data`)
3. O array `todasFontes` apos o filtro
4. Os valores de `algumaComData` e `algumaConcluida`

Isso vai permitir ver exatamente o que o cliente esta recebendo do Supabase no proximo teste, e identificar se o problema e de dados, RLS, ou build desatualizado.

### Arquivo: `src/hooks/usePedidosEtapas.ts`

Adicionar logs apos as consultas paralelas (apos linha 603) e antes das validacoes (antes da linha 614):

```typescript
console.log('[DEBUG carregamento] pedidoId:', pedidoId);
console.log('[DEBUG carregamento] ordensRes:', ordensRes.data);
console.log('[DEBUG carregamento] instRes:', instRes.data);
console.log('[DEBUG carregamento] corrRes:', corrRes.data);
console.log('[DEBUG carregamento] todasFontes:', todasFontes);
console.log('[DEBUG carregamento] algumaComData:', algumaComData, 'algumaConcluida:', algumaConcluida);
```

Esses logs serao automaticamente capturados na proxima mensagem do usuario e permitirao diagnosticar a causa raiz.

