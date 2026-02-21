
# Correção: Neo arquivada retorna para correções

## Problema

Ao arquivar uma Neo Correção (ou Neo Instalação), o sistema define `concluida: false` e `status: 'arquivada'`. Porém, a query da listagem ativa filtra apenas por `concluida = false`, sem excluir registros com `status = 'arquivada'`. Isso faz com que o item arquivado reapareça na lista de correções ativas.

## Causa raiz

- **Arquivamento** (useNeoCorrecoes.ts, linha 468-470): seta `status: 'arquivada'` e `concluida: false`
- **Listagem ativa** (useNeoCorrecoes.ts, linha 211): filtra apenas `.eq("concluida", false)`, sem excluir arquivadas

O mesmo problema existe para Neo Instalações.

## Correção

### `src/hooks/useNeoCorrecoes.ts`

Na query `neo_correcoes_listagem` (~linha 211), adicionar filtro para excluir arquivadas:

```
.eq("concluida", false)
.neq("status", "arquivada")   // <-- adicionar
```

### `src/hooks/useNeoInstalacoes.ts`

Aplicar a mesma correção na query `neo_instalacoes_listagem`, adicionando `.neq("status", "arquivada")` ao filtro existente de `concluida = false`.

## Impacto

Correção mínima (1 linha por arquivo). Itens arquivados não aparecerão mais nas listas ativas de correções e instalações.
