

## Plano: Nova página "Pagamentos Autorizados" em /logistica

### O que será feito

1. Adicionar botão "Pagamentos Autorizados" no `LogisticaHub` ao lado de "Autorizados"
2. Criar rota `/logistica/pagamentos-autorizados` apontando para a página `AcordosAutorizados` já existente em `src/pages/logistica/AcordosAutorizados.tsx`
3. Remover a funcionalidade de acordos (botão "Novo Acordo", filtros, tabela de acordos) da página `AutorizadosPrecosDirecao.tsx` quando `contexto="logistica"`

### Implementação

**1. `src/pages/logistica/LogisticaHub.tsx`**
- Adicionar item `{ label: "Pagamentos Autorizados", icon: DollarSign, path: "/logistica/pagamentos-autorizados" }` logo após o item "Autorizados"

**2. `src/App.tsx`**
- Adicionar rota: `<Route path="/logistica/pagamentos-autorizados" element={<ProtectedRoute routeKey="logistica_hub"><AcordosAutorizados /></ProtectedRoute>} />`

**3. `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**
- Remover o botão "Novo Acordo" do header quando `contexto === 'logistica'`
- Remover a seção de acordos (filtros, tabela, dialogs) quando `contexto === 'logistica'`
- Manter a funcionalidade de acordos intacta para `contexto === 'direcao'`

### Detalhes técnicos

A página `AcordosAutorizados.tsx` já existe completa com listagem, filtros, criação/edição/exclusão de acordos. Só precisa de uma rota e um botão no hub. A limpeza no `AutorizadosPrecosDirecao` evita duplicação de funcionalidade.

