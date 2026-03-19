

## Plano: Incluir instalações normais e remover limite de 30 dias

### O que será feito

Expandir a seção "Concluídas" para incluir também as instalações normais (tabela `instalacoes`) além das Neo, e remover o filtro de 30 dias para mostrar todas.

### Implementação

**1. Atualizar hook `useNeoFinalizados.ts`** (renomear para `useFinalizados` semanticamente)
- Adicionar terceira query: `instalacoes` com `instalacao_concluida = true`
- Remover filtro `.gte("concluida_em", limite)` das 3 queries
- Normalizar dados da tabela `instalacoes` (campos diferentes: `instalacao_concluida_em` → `concluida_em`, `instalacao_concluida_por` → `concluida_por`)
- Marcar com `_tipo: "instalacao"` para diferenciar
- Buscar concluidor de ambos os conjuntos de user IDs

**2. Atualizar `NeoFinalizadoRow.tsx`**
- Aceitar o novo tipo `"instalacao"` no `_tipo`
- Adicionar ícone diferenciado (ex: `Truck` azul) para instalações normais
- Badge "Instalação" azul para normais, "Neo Instalação" laranja, "Neo Correção" roxa

### Detalhes técnicos

- Campos na tabela `instalacoes`: `instalacao_concluida`, `instalacao_concluida_em`, `instalacao_concluida_por`, `nome_cliente`, `cidade`, `estado`
- Campos nas tabelas neo: `concluida`, `concluida_em`, `concluida_por`, `nome_cliente`, `cidade`, `estado`
- Normalização feita no hook para que o componente receba interface unificada
- Sem limite de 30 dias — traz todo o histórico
- Supabase tem limite de 1000 rows por query — se necessário no futuro, paginação pode ser adicionada

