

# Corrigir correções aparecendo no filtro "Entregas"

## Problema

No hook `useOrdensCarregamentoUnificadas.ts`, ao normalizar dados da tabela `correcoes`, o campo `tipo_entrega` e definido como `'entrega'` (hardcoded na linha 443). Isso faz com que, nas paginas de carregamento (`ProducaoCarregamento.tsx` e `CarregamentoMinimalista.tsx`), quando o usuario seleciona a aba "Entrega", as correcoes tambem aparecam, pois o filtro verifica `ordem.tipo_entrega === 'entrega'`.

## Solucao

Alterar o filtro de "entrega" nas duas paginas de carregamento para excluir explicitamente ordens cuja fonte e `correcoes`. Assim, mesmo que o `tipo_entrega` seja `'entrega'`, elas nao aparecem na aba errada.

## Mudancas

### 1. `src/pages/ProducaoCarregamento.tsx` (linha 34)

Alterar a condição do filtro "entrega" para excluir correções:

```text
// Antes:
return ordem.tipo_entrega === filtroTipo;

// Depois:
return ordem.tipo_entrega === filtroTipo && ordem.fonte !== 'correcoes';
```

### 2. `src/pages/fabrica/producao/CarregamentoMinimalista.tsx` (linha 36)

Mesma alteração:

```text
// Antes:
return ordem.tipo_entrega === filtroTipo;

// Depois:
return ordem.tipo_entrega === filtroTipo && ordem.fonte !== 'correcoes';
```

### 3. Contagem na aba "Entrega" (ambos arquivos)

Atualizar a contagem exibida na aba "Entrega" para tambem excluir correcoes:

```text
// Antes:
ordensDisponiveis.filter(o => o.tipo_entrega === 'entrega').length

// Depois:
ordensDisponiveis.filter(o => o.tipo_entrega === 'entrega' && o.fonte !== 'correcoes').length
```

### Arquivos modificados
1. `src/pages/ProducaoCarregamento.tsx` - filtro e contagem de entregas
2. `src/pages/fabrica/producao/CarregamentoMinimalista.tsx` - filtro e contagem de entregas

