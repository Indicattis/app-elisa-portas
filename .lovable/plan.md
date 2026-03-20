

## Plano: Alinhar estilos de Gestão de Fábrica com Frota

### Resumo
Substituir as referências de cor `primary/*` por `blue-500/*` e `white/*` em `GestaoFabricaDirecao.tsx`, alinhando com o padrão visual usado em `/logistica/frota`.

### Alterações em `src/pages/direcao/GestaoFabricaDirecao.tsx`

**1. Header buttons (linha ~371-384)**
- Botão "Pedido Teste": `bg-amber-500/10 border-amber-500/20` → manter (já é consistente)
- Botão refresh: `bg-primary/5 border-primary/10` → `bg-white/5 border-blue-500/10`

**2. TabsList desktop (linha ~474)**
- `bg-primary/5 border border-primary/10` → `bg-white/5 border border-blue-500/10`

**3. TabsTrigger (linhas ~487, 526, 565)**
- `data-[state=active]:bg-primary/10` → `data-[state=active]:bg-blue-500/10`
- Avatar borders: `border-primary/30` → `border-blue-500/30`
- AvatarFallback: `bg-primary/20` → `bg-blue-500/20`

**4. Mobile select (linhas ~414, 443)**
- `bg-primary/5 border-primary/10` → `bg-white/5 border-blue-500/10`
- Badge: `bg-primary/10` → `bg-blue-500/10`

**5. Card de conteúdo das etapas (linha ~604)**
- `bg-primary/5 border-primary/10` → `bg-white/5 border-blue-500/10`

**6. Badges de contagem (linha ~507, etc.)**
- `bg-primary/10` → `bg-blue-500/10`

**7. Responsável section (linhas ~629-662)**
- `bg-primary/10 hover:bg-primary/20` → `bg-blue-500/10 hover:bg-blue-500/20`
- `bg-primary/20` → `bg-blue-500/20`
- `border-primary/30` → `border-blue-500/30`
- `hover:bg-primary/10` → `hover:bg-blue-500/10`

**8. Arquivo morto card (linha ~833, 849, 871)**
- `bg-primary/5 border-primary/10` → `bg-white/5 border-blue-500/10`
- Input: `bg-primary/5 border-primary/10` → `bg-white/5 border-blue-500/10`
- Archived items: `bg-primary/5 border border-primary/10 hover:bg-primary/10` → `bg-white/5 border border-blue-500/10 hover:bg-white/10`

### Arquivo impactado
- `src/pages/direcao/GestaoFabricaDirecao.tsx` (substituição de classes CSS apenas)

