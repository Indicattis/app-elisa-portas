
# Excluir a pagina /logistica/controle

## Alteracoes

### 1. Deletar o arquivo
- `src/pages/logistica/ControleLogistica.tsx`

### 2. `src/App.tsx`
- Remover o import do `ControleLogistica` (linha 241)
- Remover a rota `/logistica/controle` (linha 489)

### 3. `src/pages/logistica/LogisticaHub.tsx`
- Remover o item "Controle" do array `menuItems` (linha 10)
- Remover o import do icone `ClipboardList` se nao for usado em outro lugar
