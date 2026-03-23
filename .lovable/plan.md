

## Plano: Aplicar estilo MinimalistLayout na página de Autorizados

### Problema
A página `/direcao/autorizados` usa layout manual (header sticky simples, sem glassmorphism), enquanto `/logistica/frota` usa o `MinimalistLayout` com estética glassmorphism (botão voltar estilizado, header com `bg-white/5 backdrop-blur-xl border-white/10`, breadcrumbs animados).

### Alteração

**Arquivo: `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**

Refatorar para usar `MinimalistLayout` em vez do layout manual:

1. Importar `MinimalistLayout`
2. Remover o `AnimatedBreadcrumb` manual, o header sticky e a estrutura externa (`div.min-h-screen`, `div.pt-12`, `header.sticky`)
3. Envolver o conteúdo com `<MinimalistLayout>`, passando:
   - `title="Gestão de Autorizados"`
   - `subtitle="{estados.length} estados cadastrados"`
   - `backPath={backPath}`
   - `breadcrumbItems` com os mesmos itens atuais
   - `headerActions` com os botões existentes (Novo Autorizado, Novo Estado, Novo Acordo), estilizados com gradiente azul como na Frota (`bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/20`)
4. O conteúdo interno (estados grid + acordos table) permanece igual, dentro do `children` do layout
5. Atualizar a `Card` da tabela de acordos para usar `bg-white/5 border-blue-500/10 backdrop-blur-xl` (como FrotaTable) em vez de `bg-primary/5 border-primary/10`
6. Atualizar `TableRow` borders para `border-blue-500/10` e hovers para `hover:bg-white/5`

