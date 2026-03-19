

## Plano: Adicionar equipe responsável nas concluídas

### O que será feito

Mostrar o nome da equipe que realizou cada instalação/correção na seção "Concluídas".

### Implementação

**1. Atualizar `useNeoFinalizados.ts`**
- Adicionar `equipe_nome` ao select de `neo_instalacoes` e `neo_correcoes`
- Adicionar `responsavel_instalacao_nome` ao select de `instalacoes`
- Normalizar para um campo unificado `equipe_nome` no `FinalizadoItem`
- Adicionar `equipe_nome: string | null` à interface `FinalizadoItem`

**2. Atualizar `NeoFinalizadoRow.tsx`**
- Exibir o nome da equipe como badge ou texto ao lado da localização
- Usar um estilo discreto (texto muted ou badge outline) para não poluir a linha

### Detalhes técnicos

| Tabela | Campo equipe |
|--------|-------------|
| `neo_instalacoes` | `equipe_nome` (já desnormalizado) |
| `neo_correcoes` | `equipe_nome` (já desnormalizado) |
| `instalacoes` | `responsavel_instalacao_nome` |

Os campos já existem nas tabelas — não precisa de joins adicionais, apenas incluir nos selects.

