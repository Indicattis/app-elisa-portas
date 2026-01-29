
# Plano: Corrigir Erro de Coluna Inexistente ao Concluir Ordem de Qualidade

## Problema Identificado

Ao tentar concluir uma ordem em `/producao/qualidade`, o sistema retorna o erro:

```
PGRST204: Could not find the 'linha_problema_id' column of 'ordens_qualidade' in the schema cache
```

## Causa Raiz

O hook `useOrdemProducao.ts` usa uma lógica genérica para todas as tabelas de ordens (`ordens_soldagem`, `ordens_perfiladeira`, `ordens_separacao`, `ordens_qualidade`). Na função `concluirOrdem` (linha 505-517), o código tenta resetar o campo `linha_problema_id`:

```tsx
const { error } = await supabase
  .from(tabelaOrdem)
  .update({ 
    status: 'concluido',
    data_conclusao: new Date().toISOString(),
    tempo_conclusao_segundos,
    historico: true,
    pausada: false,
    pausada_em: null,
    justificativa_pausa: null,
    linha_problema_id: null,  // ❌ NÃO EXISTE EM ordens_qualidade
  })
  .eq('id', ordemId);
```

**O problema**: A tabela `ordens_qualidade` não possui a coluna `linha_problema_id`, diferente das outras tabelas de ordens de produção.

---

## Análise das Colunas por Tabela

| Tabela | linha_problema_id |
|--------|-------------------|
| ordens_soldagem | Sim |
| ordens_perfiladeira | Sim |
| ordens_separacao | Sim |
| ordens_qualidade | **Não** |

---

## Solução

Modificar a função `concluirOrdem` para incluir `linha_problema_id` apenas quando o tipo de ordem for diferente de `qualidade`:

```tsx
// Construir objeto de atualização base
const updateData: any = {
  status: 'concluido',
  data_conclusao: new Date().toISOString(),
  tempo_conclusao_segundos,
  historico: true,
  pausada: false,
  pausada_em: null,
  justificativa_pausa: null,
};

// Adicionar linha_problema_id apenas para ordens que possuem esse campo
if (tipoOrdem !== 'qualidade') {
  updateData.linha_problema_id = null;
}

const { error } = await supabase
  .from(tabelaOrdem)
  .update(updateData)
  .eq('id', ordemId);
```

---

## Alteração Necessária

### Arquivo: `src/hooks/useOrdemProducao.ts`

**Linhas 505-517**: Substituir o objeto inline por construção condicional:

```tsx
// ANTES (Linhas 505-517)
const { error } = await supabase
  .from(tabelaOrdem)
  .update({ 
    status: 'concluido',
    data_conclusao: new Date().toISOString(),
    tempo_conclusao_segundos,
    historico: true,
    pausada: false,
    pausada_em: null,
    justificativa_pausa: null,
    linha_problema_id: null,
  })
  .eq('id', ordemId);

// DEPOIS
const updateData: Record<string, any> = {
  status: 'concluido',
  data_conclusao: new Date().toISOString(),
  tempo_conclusao_segundos,
  historico: true,
  pausada: false,
  pausada_em: null,
  justificativa_pausa: null,
};

// linha_problema_id não existe em ordens_qualidade
if (tipoOrdem !== 'qualidade') {
  updateData.linha_problema_id = null;
}

const { error } = await supabase
  .from(tabelaOrdem)
  .update(updateData)
  .eq('id', ordemId);
```

---

## Resumo

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useOrdemProducao.ts` | Condicionar inclusão de `linha_problema_id` ao tipo de ordem |

---

## Impacto

- **Correção imediata**: Ordens de qualidade poderão ser concluídas sem erro
- **Sem breaking changes**: Ordens de soldagem, perfiladeira e separação continuam funcionando normalmente
- **Manutenibilidade**: Código explicita a diferença entre as tabelas
