
# Plano: Corrigir Recaptura de Ordem Pausada com Linhas Problemáticas

## Problema Identificado

Quando uma ordem pausada é recapturada, os seguintes campos são resetados:
- `pausada: false` ✓
- `pausada_em: null` ✓
- `justificativa_pausa: null` ✓

Porém, **NÃO** são resetados:
- `linha_problema_id` na ordem
- `com_problema` nas linhas da tabela `linhas_ordens`

Isso impede que o operador conclua a ordem mesmo após recapturá-la, pois o botão "Concluir" fica oculto quando há linhas com problema.

## Dados Atuais da Ordem OPE-2026-0047

| Campo | Valor |
|-------|-------|
| pausada | true |
| responsavel_id | null |
| linha_problema_id | definido |
| Linhas com `com_problema` | 4 de 6 |
| Linhas `concluida` | 6 de 6 |

## Solução

Modificar a função `capturarOrdem` em `useOrdemProducao.ts` para também limpar os campos de problema das linhas quando uma ordem pausada é recapturada.

### Arquivo a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/hooks/useOrdemProducao.ts` | Adicionar limpeza de `com_problema` das linhas ao recapturar ordem pausada |

### Mudança no Código

Na função `capturarOrdem`, após limpar os campos de pausa da ordem (linhas 354-358), adicionar a limpeza das linhas:

```typescript
// Se a ordem estava pausada, resetar os campos de pausa mas manter tempo_acumulado
if (ordemAtual?.pausada) {
  updateData.pausada = false;
  updateData.pausada_em = null;
  updateData.justificativa_pausa = null;
  updateData.linha_problema_id = null; // NOVO: Limpar referência à linha problema
  updateData.capturada_em = new Date().toISOString();
  
  // NOVO: Limpar flags de problema das linhas associadas à ordem
  await supabase
    .from('linhas_ordens')
    .update({
      com_problema: false,
      problema_descricao: null,
      problema_reportado_em: null,
      problema_reportado_por: null,
    })
    .eq('ordem_id', ordemId)
    .eq('tipo_ordem', tipoOrdem);
}
```

## Fluxo Corrigido

1. Operador clica em "Capturar" na ordem pausada
2. Sistema limpa `pausada`, `pausada_em`, `justificativa_pausa`, `linha_problema_id`
3. **NOVO:** Sistema limpa `com_problema` de todas as linhas da ordem
4. Operador pode trabalhar normalmente e concluir a ordem

## Correção Imediata para OPE-2026-0047

Além da correção no código, executar uma query para limpar os dados da ordem afetada:

```sql
-- Limpar flags de problema das linhas
UPDATE linhas_ordens 
SET com_problema = false, problema_descricao = null, problema_reportado_em = null, problema_reportado_por = null
WHERE ordem_id = '6ff87734-c222-466f-8ec2-1b98554aa366';

-- Limpar estado de pausa da ordem
UPDATE ordens_perfiladeira 
SET pausada = false, pausada_em = null, justificativa_pausa = null, linha_problema_id = null
WHERE id = '6ff87734-c222-466f-8ec2-1b98554aa366';
```

## Resultado Esperado

- Ao recapturar uma ordem pausada, todas as marcações de problema são automaticamente limpas
- O operador pode começar a trabalhar imediatamente sem precisar resolver problemas manualmente
- O botão "Concluir" aparece assim que todas as linhas estiverem marcadas como concluídas
