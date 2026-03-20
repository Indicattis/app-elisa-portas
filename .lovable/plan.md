
## Plano: Aplicar estilo MinimalistLayout à página PedidosPagosSemEntrega

A página atual usa layout genérico (`bg-background`, botão outline, sem glassmorphism). Precisa usar o `MinimalistLayout` como `/logistica/frota` faz.

### Mudanças em `src/pages/logistica/PedidosPagosSemEntrega.tsx`

1. **Envolver com `MinimalistLayout`** — substituir o wrapper manual (`div.min-h-screen`, header com botão voltar) pelo componente `MinimalistLayout` com:
   - `title="Pedidos Pagos sem Data de Entrega"`
   - `subtitle="Pedidos pagos aguardando data de entrega"`
   - `backPath="/logistica"`
   - `breadcrumbItems` com Home > Logística > Pedidos sem Entrega
   - `headerActions` com o botão "Novo Cadastro"

2. **Estilizar a tabela** com glassmorphism — envolver em `Card` com classes `bg-white/5 border-blue-500/10 backdrop-blur-xl`, aplicar `text-white/70` nos headers e `text-white/90` nas cells, `hover:bg-white/5` nas rows.

3. **Estilizar o Dialog** — adicionar classes de glassmorphism ao `DialogContent` (`bg-black/90 border-white/10 backdrop-blur-xl`), labels e inputs com cores white/70.

4. **Loading e empty state** — spinner com `border-blue-400`, texto vazio com `text-white/50`.

### Arquivo
- `src/pages/logistica/PedidosPagosSemEntrega.tsx` — reescrita do layout e estilos
