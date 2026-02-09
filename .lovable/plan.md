

# Melhorar layout das etiquetas de producao

## Resumo

Reestruturar o layout do PDF das etiquetas para exibir:
- **Topo**: Logo da empresa + identificacao da porta (ex: "Porta #01 -- 4,00m x 2,00m")
- **Tabela**: CLIENTE, PRODUTO, TAMANHO (campo separado, novo), QUANTIDADE, RESPONSAVEL

Remover as linhas de DIMENSOES e PINTURA da tabela, ja que as dimensoes vao para o cabecalho junto com a porta.

## Detalhe tecnico

### 1. Arquivo: `src/types/etiqueta.ts`

Adicionar campo `portaLabel` ao tipo `TagProducao`:

```typescript
portaLabel?: string;  // Ex: "Porta #01 — 4,00m x 2,00m"
```

### 2. Arquivo: `src/utils/etiquetasPDFGenerator.ts`

Reescrever a funcao `desenharEtiquetaProducao` para o novo layout:

**Cabecalho (topo)**:
- Logo centralizada (como ja esta)
- Abaixo da logo, texto da porta centralizado em fonte grande (ex: "Porta #01 -- 4,00m x 2,00m"), usando `tag.portaLabel` se disponivel

**Tabela (5 linhas fixas)**:
1. CLIENTE -- `tag.clienteNome`
2. PRODUTO -- `tag.nomeProduto`
3. TAMANHO -- `tag.tamanho` formatado (ou `tag.largura x tag.altura` como fallback)
4. QUANTIDADE -- `tag.quantidade`
5. RESPONSAVEL -- `tag.responsavelNome`

Remover as linhas condicionais de DIMENSOES e PINTURA. Remover o rodape de cor.

### 3. Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

No `handleImprimirEtiqueta` (~linha 214), montar o `portaLabel` a partir dos dados da linha:

```typescript
// Determinar label da porta
const portaKey = linha.produto_venda_id
  ? `${linha.produto_venda_id}_${linha.indice_porta ?? 0}`
  : null;
const portaNum = portaKey ? portasNumeracaoMap.get(portaKey) : null;
// portaLabel sera algo como "Porta #01 -- 4,00m x 2,00m"
```

Adicionar `portaLabel` ao objeto tag.

### 4. Arquivo: `src/components/fabrica/OrdemLinhasSheet.tsx`

No `handleImprimirEtiqueta` (~linha 349), montar o `portaLabel` de forma similar, usando `indice_porta` da linha.

### 5. Arquivo: `src/components/ordens/ImprimirEtiquetasModal.tsx`

No `criarTagProducao`, nao ha informacao de porta disponivel neste contexto (etiquetas do pedido, nao da ordem). O campo `portaLabel` ficara `undefined` e o cabecalho mostrara apenas a logo.

### 6. Arquivo: `src/components/carregamento/CarregamentoDownbar.tsx`

Verificar se ha dados de porta disponivel para popular `portaLabel`. Caso contrario, fica sem o label (apenas logo).

## Arquivos modificados

1. **Editar**: `src/types/etiqueta.ts` -- adicionar `portaLabel`
2. **Editar**: `src/utils/etiquetasPDFGenerator.ts` -- novo layout da tabela
3. **Editar**: `src/components/production/OrdemDetalhesSheet.tsx` -- montar `portaLabel`
4. **Editar**: `src/components/fabrica/OrdemLinhasSheet.tsx` -- montar `portaLabel`
5. **Editar**: `src/components/ordens/ImprimirEtiquetasModal.tsx` -- sem alteracao funcional, apenas compatibilidade
6. **Editar**: `src/components/carregamento/CarregamentoDownbar.tsx` -- verificar e adicionar `portaLabel` se disponivel
