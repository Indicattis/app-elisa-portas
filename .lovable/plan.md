

## Plano: Seção de concluídos em Ordens de Instalação

### O que será feito

Adicionar uma nova seção accordion "Concluídas" ao final da página `/logistica/instalacoes/ordens-instalacoes`, listando Neo Instalações e Neo Correções finalizadas. Usará o componente `NeoFinalizadoRow` já existente.

### Implementação

**1. Criar hook `useNeoFinalizados`** (`src/hooks/useNeoFinalizados.ts`)
- Query em `neo_instalacoes` com `concluida = true`, limitado aos últimos 30 dias
- Query em `neo_correcoes` com `concluida = true`, limitado aos últimos 30 dias
- Buscar dados do concluidor (`concluida_por` → `admin_users`)
- Combinar e ordenar por `concluida_em` descendente (mais recentes primeiro)
- Retornar lista unificada com `_tipo` marcado

**2. Modificar `OrdensInstalacoesLogistica.tsx`**
- Importar o novo hook e `NeoFinalizadoRow`
- Importar `CheckCircle2` do lucide
- Adicionar nova `AccordionItem` value="concluidas" após "Correções Avulsas"
- Ícone `CheckCircle2` verde esmeralda, badge com contagem
- Renderizar cada item com `NeoFinalizadoRow`

### Detalhes técnicos

- Filtro de 30 dias evita carregar histórico completo
- Reutiliza `NeoFinalizadoRow` que já exibe ícone do tipo, nome, badge, localização, tempo relativo e avatar do concluidor
- Accordion começa fechado (collapsible, sem defaultValue)

