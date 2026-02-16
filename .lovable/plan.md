

# Remover Finalizados e renomear seção

## Resumo
Remover a seção "Finalizados" da página de Ordens de Instalação e renomear "Prontas para Instalação" para "Carregadas".

## Mudanças

### Arquivo: `src/pages/logistica/OrdensInstalacoesLogistica.tsx`

**Remover seção Finalizados**
- Remover o AccordionItem "finalizados" (linhas 286-314)
- Remover os hooks `useNeoInstalacoesFinalizadas` e `useNeoCorrecoesFinalizadas` e suas variáveis derivadas (`finalizados`, `isLoadingFinalizados`)
- Remover os imports não mais utilizados: `useNeoInstalacoesFinalizadas`, `useNeoCorrecoesFinalizadas`, `NeoFinalizadoRow`, `CheckCircle2`

**Renomear seção**
- Alterar o texto "Prontas para Instalação" para "Carregadas" no AccordionTrigger (linha 357)
- Ajustar a mensagem de vazio de "Nenhuma instalação pronta (carregada)." para "Nenhuma instalação carregada."

**Ajustar subtítulo do header**
- Atualizar o texto de resumo (linha 220) para refletir a nova nomenclatura: trocar "prontas" por "carregadas"

### Arquivos envolvidos
- `src/pages/logistica/OrdensInstalacoesLogistica.tsx`

