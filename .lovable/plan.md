
# Plano: Permitir Múltiplas Linhas na Pausa de Ordem

## Problema Atual
O modal de "Aviso de Falta" permite selecionar apenas **uma linha** com problema. O usuário quer poder selecionar **múltiplas linhas** ao pausar uma ordem.

---

## Arquitetura da Solução

A tabela `linhas_ordens` já possui o campo `com_problema: boolean` para cada linha. A estratégia será:
- Permitir multi-seleção no modal
- Marcar todas as linhas selecionadas com `com_problema: true`
- Atualizar a exibição para mostrar todas as linhas com problema

---

## Alterações Necessárias

### 1. `src/components/production/AvisoFaltaModal.tsx`

**Trocar Select por Checkboxes para multi-seleção:**

| Antes | Depois |
|-------|--------|
| `Select` com valor único | Lista de `Checkbox` para cada linha |
| Estado: `tipoProblema: string` | Estado: `linhasSelecionadas: string[]` |
| Callback: `onConfirm(justificativa, linhaProblemaId?)` | Callback: `onConfirm(justificativa, linhasProblemaIds?)` |

**Mudanças específicas:**
- Remover o componente `Select`
- Adicionar lista de checkboxes com as linhas disponíveis
- Validar que ao menos uma linha foi selecionada OU justificativa foi preenchida
- Exibir resumo das linhas selecionadas

---

### 2. `src/hooks/useOrdemProducao.ts`

**Atualizar a mutation `pausarOrdem`:**

```text
// Linha 631 - Alterar assinatura
DE: { ordemId, justificativa, linhaProblemaId }
PARA: { ordemId, justificativa, linhasProblemaIds }

// Adicionar após linha 670 - Marcar múltiplas linhas
Se linhasProblemaIds tiver itens:
  - UPDATE linhas_ordens SET com_problema = true
    WHERE id IN (linhasProblemaIds)
  - Armazenar primeira linha em linha_problema_id (compatibilidade)
```

---

### 3. Páginas de Produção (Handlers)

**Arquivos afetados:**
- `src/pages/ProducaoSolda.tsx`
- `src/pages/ProducaoPerfiladeira.tsx`
- `src/pages/ProducaoSeparacao.tsx`
- `src/pages/fabrica/producao/SeparacaoMinimalista.tsx`
- `src/pages/fabrica/producao/PerfiladeiraMinimalista.tsx`
- `src/pages/fabrica/producao/SoldagemMinimalista.tsx`

**Mudança:**
```typescript
// DE:
handlePausarOrdem(ordemId, justificativa, linhaProblemaId?)

// PARA:
handlePausarOrdem(ordemId, justificativa, linhasProblemaIds?)
```

---

### 4. `src/components/production/OrdemDetalhesSheet.tsx`

**Atualizar prop type:**
```typescript
// Linha 118
DE: onPausarOrdem?: (ordemId, justificativa, linhaProblemaId?) => Promise<void>
PARA: onPausarOrdem?: (ordemId, justificativa, linhasProblemaIds?) => Promise<void>
```

---

### 5. Exibição de Linhas com Problema (Opcional)

**`src/components/fabrica/OrdemLinhasSheet.tsx`:**
- Atualmente mostra apenas `ordem.linha_problema` (singular)
- Alterar para mostrar todas as linhas onde `com_problema === true`

---

## Fluxo do Usuário Atualizado

```text
1. Operador clica em "Aviso de Falta"
2. Modal abre com checkboxes para cada linha da ordem
3. Operador marca uma ou mais linhas com problema
4. (Opcional) Adiciona justificativa adicional
5. Clica em "Pausar Ordem"
6. Sistema:
   - Marca todas as linhas selecionadas com com_problema = true
   - Pausa a ordem
   - Libera para outro operador
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/production/AvisoFaltaModal.tsx` | Converter para multi-seleção com checkboxes |
| `src/hooks/useOrdemProducao.ts` | Aceitar array de IDs e marcar múltiplas linhas |
| `src/components/production/OrdemDetalhesSheet.tsx` | Atualizar tipo da prop |
| `src/pages/ProducaoSolda.tsx` | Atualizar handler |
| `src/pages/ProducaoPerfiladeira.tsx` | Atualizar handler |
| `src/pages/ProducaoSeparacao.tsx` | Atualizar handler |
| `src/pages/fabrica/producao/SoldagemMinimalista.tsx` | Atualizar handler |
| `src/pages/fabrica/producao/PerfiladeiraMinimalista.tsx` | Atualizar handler |
| `src/pages/fabrica/producao/SeparacaoMinimalista.tsx` | Atualizar handler |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Exibir múltiplas linhas com problema |
