
# Botao para abrir calendario de expedicao nas etapas Instalacoes e Expedicao Coleta

## Resumo
Adicionar um botao com icone de calendario nas etapas "Instalacoes" e "Expedicao Coleta" da pagina `/direcao/gestao-fabrica`. Ao clicar, abre um modal grande (Dialog) com o calendario mensal de expedicao em modo somente leitura (sem drag-and-drop).

## Alteracoes

### 1. Novo componente: `src/components/pedidos/CalendarioExpedicaoModal.tsx`
Criar um modal (usando Dialog do Radix) que:
- Recebe `open` e `onOpenChange` como props
- Internamente gerencia estado de data, tipo de visualizacao (semana/mes) e legendas
- Usa os hooks `useOrdensCarregamentoCalendario`, `useNeoInstalacoes`, `useNeoCorrecoes`, `useCorrecoes` e `useCorrecoesSemData` para buscar dados
- Renderiza `CalendarioMensalExpedicaoDesktop` ou `CalendarioSemanalExpedicaoDesktop` com `readOnly={true}`
- Usa `DialogContent` com classe `max-w-[95vw] max-h-[90vh] overflow-y-auto` para ocupar quase toda a tela
- Inclui botoes de alternancia semana/mes no header do modal

### 2. Editar: `src/pages/direcao/GestaoFabricaDirecao.tsx`
- Importar `CalendarioExpedicaoModal` e icone `Calendar` do lucide-react
- Adicionar estado `showCalendarioModal` (boolean)
- Na area do `CardTitle` (linha ~435), adicionar condicionalmente um botao de calendario quando `etapa === 'instalacoes' || etapa === 'aguardando_coleta'`
- Renderizar o `CalendarioExpedicaoModal` controlado pelo estado

### Detalhes tecnicos

O modal reutiliza os mesmos componentes de calendario ja existentes (`CalendarioMensalExpedicaoDesktop` e `CalendarioSemanalExpedicaoDesktop`) passando `readOnly={true}`, o que desabilita drag-and-drop e acoes de edicao. Os dados sao buscados pelos mesmos hooks usados na pagina `/logistica/expedicao`.

### Arquivos afetados
- **Novo:** `src/components/pedidos/CalendarioExpedicaoModal.tsx`
- **Editado:** `src/pages/direcao/GestaoFabricaDirecao.tsx`
