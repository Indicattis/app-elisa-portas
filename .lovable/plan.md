

## Plano: Adicionar Checklist Liderança ao hub da Direção

### O que será feito

Criar uma nova rota `/direcao/checklist-lideranca` que renderiza o componente `ChecklistLideranca` já existente (`src/pages/ChecklistLideranca.tsx`), e adicionar um botão correspondente no hub da Direção.

### Implementação

**1. Adicionar rota em `src/App.tsx`**
- Importar `ChecklistLideranca` de `src/pages/ChecklistLideranca`
- Adicionar `<Route path="/direcao/checklist-lideranca" ...>` junto às outras rotas de direção, com `ProtectedRoute` usando `routeKey="direcao_hub"`

**2. Adicionar botão no `src/pages/direcao/DirecaoHub.tsx`**
- Importar ícone `ClipboardCheck` do lucide
- Adicionar item `{ label: 'Checklist Liderança', icon: ClipboardCheck, path: '/direcao/checklist-lideranca' }` ao array `menuItems`

**3. Adicionar navegação de volta no `ChecklistLideranca.tsx`**
- Adicionar um botão "Voltar" que navega para `/direcao`, seguindo o padrão visual das outras páginas da direção (botão fixo no canto superior esquerdo com gradiente azul)

