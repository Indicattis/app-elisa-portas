

# Remover foto e adicionar checklist de itens no Carregamento

## O que muda

Na tela de carregamento (`/producao/carregamento`), o sistema atual exige uma foto para concluir. Sera substituido por um sistema de checkboxes onde o operador marca cada item que foi carregado no caminhao. So podera concluir quando todos os itens estiverem marcados.

## Alteracoes

### 1. `src/components/carregamento/CarregamentoDownbar.tsx`

- **Remover** toda a logica de foto: estado `fotoFile`, `fotoPreview`, `fileInputRef`, `handleFotoChange`, `handleRemoverFoto`, e a secao "Foto do Carregamento" no JSX
- **Remover** imports de `Camera`, `X`, `ImageIcon` e `useRef`
- **Adicionar** estado `itensMarcados` (um `Set<string>` com os IDs das linhas marcadas)
- **Transformar** a lista de itens de somente-leitura para interativa: cada item tera um checkbox ao lado
- **Alterar** `handleConcluir`:
  - Remover validacao de foto (`if (!fotoFile)`)
  - Adicionar validacao de que todos os itens estao marcados
  - Passar `fotoFile: undefined` no `onConcluir`
- **Alterar** o botao "Concluir Carregamento": desabilitar quando nem todos os itens estiverem marcados (em vez de `!fotoFile`)
- Adicionar um botao "Marcar Todos" para facilitar

### 2. `src/components/carregamento/CarregamentoDownbar.tsx` - Interface `onConcluir`

- O parametro `fotoFile` ja e opcional na interface (`fotoFile?: File`), entao nao precisa mudar a interface

### 3. Nenhuma alteracao necessaria nos hooks

O hook `useOrdensCarregamentoUnificadas` ja trata `fotoFile` como opcional no upload -- se nao houver foto, simplesmente nao faz upload. Nao precisa alterar.

## Resultado

- O operador vera a lista de itens com checkboxes
- Precisara marcar cada item individualmente (ou usar "Marcar Todos")
- O botao "Concluir Carregamento" so ficara ativo quando todos os itens estiverem marcados
- A foto deixa de ser exigida

