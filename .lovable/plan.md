

# Adicionar funcionalidade de pausar ordens de qualidade

## Problema

A pagina `/producao/qualidade` nao permite pausar ordens (Aviso de Falta), diferente das demais paginas de producao (solda, perfiladeira, separacao). A tabela `ordens_qualidade` ja possui os campos necessarios (`pausada`, `pausada_em`, `justificativa_pausa`, `tempo_acumulado_segundos`), faltando apenas conectar a logica no frontend.

## O que sera feito

Habilitar o botao "Aviso de Falta" e o modal de pausa nas paginas de qualidade, permitindo que operadores pausem ordens com justificativa.

## Detalhe tecnico

### 1. Arquivo: `src/hooks/useOrdemProducao.ts`

Na mutation `pausarOrdem` (linha 646), o type cast exclui `ordens_qualidade`. Atualizar para incluir:

```typescript
// De:
const tabelaOrdem = TABELA_MAP[tipoOrdem] as 'ordens_separacao' | 'ordens_perfiladeira' | 'ordens_soldagem';

// Para:
const tabelaOrdem = TABELA_MAP[tipoOrdem] as 'ordens_separacao' | 'ordens_perfiladeira' | 'ordens_soldagem' | 'ordens_qualidade';
```

Na linha 690, o campo `linha_problema_id` nao existe em `ordens_qualidade`. Condicionar:

```typescript
// De:
linha_problema_id: linhasProblemaIds?.[0] || null,

// Para: (condicional, fora do update principal)
// Adicionar linha_problema_id apenas para tipos que nao sejam qualidade
```

Reestruturar o update para montar o objeto dinamicamente, similar ao que ja e feito em `concluirOrdem` (linhas 537-540).

### 2. Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

Nas linhas 1038 e 1080, adicionar `'qualidade'` a condicao que exibe o botao e o modal de pausa:

```typescript
// De:
(tipoOrdem === 'separacao' || tipoOrdem === 'perfiladeira' || tipoOrdem === 'soldagem')

// Para:
(tipoOrdem === 'separacao' || tipoOrdem === 'perfiladeira' || tipoOrdem === 'soldagem' || tipoOrdem === 'qualidade')
```

### 3. Arquivo: `src/pages/ProducaoQualidade.tsx`

Destructurar `pausarOrdem` do hook e passar as props ao `OrdemDetalhesSheet`:

```typescript
const { ..., pausarOrdem } = useOrdemProducao('qualidade', tentarAvancoAutomatico);

// No OrdemDetalhesSheet:
onPausarOrdem={async (ordemId, justificativa, linhasProblemaIds) => {
  await pausarOrdem.mutateAsync({ ordemId, justificativa, linhasProblemaIds });
  setSheetOpen(false);
}}
isPausing={pausarOrdem.isPending}
```

### 4. Arquivo: `src/pages/fabrica/producao/QualidadeMinimalista.tsx`

Mesma alteracao da pagina legada: destructurar `pausarOrdem` e conectar ao sheet.

## Arquivos modificados

1. **Editar**: `src/hooks/useOrdemProducao.ts` -- incluir `ordens_qualidade` no cast e condicionar `linha_problema_id`
2. **Editar**: `src/components/production/OrdemDetalhesSheet.tsx` -- adicionar `qualidade` nas condicoes de pausa
3. **Editar**: `src/pages/ProducaoQualidade.tsx` -- conectar `pausarOrdem` ao sheet
4. **Editar**: `src/pages/fabrica/producao/QualidadeMinimalista.tsx` -- conectar `pausarOrdem` ao sheet
