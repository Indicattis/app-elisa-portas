
# Plano: Diagnosticar e Corrigir Ordens de Qualidade Nao Aparecendo

## Analise Realizada

1. **Banco de dados**: Confirmado 13 ordens de qualidade com `status='pendente'` e `historico=false`
2. **API**: Requisicao GET retorna status 200 com os dados corretos
3. **Relacionamentos**: Todas as ordens tem pedidos validos e vendas associadas
4. **Linhas**: 50 linhas associadas as ordens de qualidade ativas

## Possivel Causa

A pagina pode estar usando codigo antigo apos as recentes alteracoes, ou pode haver um erro silencioso durante o processamento dos dados no hook `useOrdemProducao`.

---

## Solucao Proposta

### Passo 1: Verificar se e um problema de cache

Primeiro, tente **atualizar a pagina** (Ctrl+Shift+R ou Command+Shift+R) para garantir que o codigo mais recente esta sendo usado.

### Passo 2: Se persistir, adicionar tratamento de erro

#### Arquivo: `src/hooks/useOrdemProducao.ts`

Adicionar tratamento de erro melhorado na query para capturar qualquer problema:

**Linha ~123 - Melhorar tratamento de erro:**

```typescript
if (ordensError) {
  console.error('[useOrdemProducao] Erro ao buscar ordens:', ordensError);
  throw ordensError;
}

console.log(`[useOrdemProducao] ${tipoOrdem}: ${ordensData?.length || 0} ordens encontradas`);

if (!ordensData || ordensData.length === 0) return [];
```

**Linha ~138 - Capturar erro de linhas:**

```typescript
if (linhasError) {
  console.error('[useOrdemProducao] Erro ao buscar linhas:', linhasError);
  // Continuar mesmo sem linhas, nao lancar erro
}
```

**Linha ~231 - Log do resultado final:**

```typescript
console.log(`[useOrdemProducao] ${tipoOrdem}: ${ordensProcessadas.length} ordens processadas`);
return ordensProcessadas as Ordem[];
```

---

## Resumo

| Arquivo | Acao |
|---------|------|
| N/A | Primeiro: Atualizar pagina (Ctrl+Shift+R) |
| `src/hooks/useOrdemProducao.ts` | Se persistir: Adicionar logs de debug |

## Resultado Esperado

- Se for cache: Atualizar resolvera
- Se for erro: Os logs no console mostrarao onde esta falhando
