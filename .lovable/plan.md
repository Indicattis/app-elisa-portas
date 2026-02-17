
# Mover formulario Neo para /logistica/expedicao/nova-neo

## Resumo
Excluir a pagina de listagem `/logistica/neos` e mover o formulario de cadastro para `/logistica/expedicao/nova-neo`. Todas as referencias serao atualizadas.

## Alteracoes

### 1. Excluir arquivo
- `src/pages/logistica/NeosCadastro.tsx` — remover completamente

### 2. Mover e renomear formulario
- Renomear `src/pages/logistica/NeosCadastroForm.tsx` para `src/pages/logistica/NovaNeoForm.tsx`
- Atualizar navegacao interna:
  - `backPath` de `/logistica/neos` para `/logistica/expedicao`
  - Breadcrumb: Home > Logistica > Expedicao > Nova Neo
  - Botao "Cancelar" redireciona para `/logistica/expedicao`
  - Apos salvar, redireciona para `/logistica/expedicao`

### 3. Rotas no App.tsx
- Remover rota `/logistica/neos`
- Remover rota `/logistica/neos/novo`
- Remover imports de `NeosCadastro` e `NeosCadastroForm`
- Adicionar rota `/logistica/expedicao/nova-neo` apontando para `NovaNeoForm`

### 4. Hub de Logistica (LogisticaHub.tsx)
- Remover item "Servicos Neo" do menu (ou apontar para a nova rota, dependendo da preferencia)

### 5. Botao "Novo Neo" na Expedicao (ExpedicaoMinimalista.tsx)
- Alterar navegacao de `/logistica/neos` para `/logistica/expedicao/nova-neo`

### Arquivos envolvidos
- `src/pages/logistica/NeosCadastro.tsx` (excluir)
- `src/pages/logistica/NeosCadastroForm.tsx` (excluir e recriar como `NovaNeoForm.tsx`)
- `src/App.tsx` (atualizar rotas e imports)
- `src/pages/logistica/LogisticaHub.tsx` (remover item do menu)
- `src/pages/logistica/ExpedicaoMinimalista.tsx` (atualizar navegacao)
