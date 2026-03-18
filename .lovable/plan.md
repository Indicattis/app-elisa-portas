

## Plano: Alinhar estilo visual do Pedido com a Frota

A página do pedido já usa `MinimalistLayout` (fundo escuro), mas os cards usam `bg-primary/5 border-primary/10` enquanto a frota usa `bg-white/5 border-blue-500/10`. A diferença principal é a paleta de cores dos cards e botões.

### Mudanças

**Arquivo**: `src/pages/administrativo/PedidoViewMinimalista.tsx`

1. **Cards**: Trocar todas as ocorrências de `bg-primary/5 border-primary/10` por `bg-white/5 border-blue-500/10` (padrão da frota)
2. **Textarea**: Trocar `bg-primary/5 border-primary/10` por `bg-white/5 border-blue-500/10`
3. **Spinner de loading**: Trocar `border-primary` por `border-blue-400` (padrão frota)
4. **Botões de ação**: Alinhar estilo dos botões do header com o padrão gradiente da frota (`bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/20`)

São apenas alterações de classes CSS, sem mudança de lógica.

