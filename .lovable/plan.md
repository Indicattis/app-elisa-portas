

## Plano: Alinhar estilo de /logistica/frete com /logistica/frota

### Problema
A página de Frete usa layout customizado com header próprio, enquanto Frota usa o componente `MinimalistLayout` com header glassmorphism padronizado.

### Alteração em `src/pages/logistica/FreteMinimalista.tsx`

1. **Substituir layout customizado por `MinimalistLayout`** — usar o mesmo componente que `FrotaMinimalista`:
   - `title="Frete por Cidade"`, `subtitle="Gerencie os valores de frete"`, `backPath="/logistica"`
   - Breadcrumb: Home > Logística > Frete
   - `headerActions`: filtros (busca + select estado) + botão "Novo"

2. **Mover filtros para o `headerActions`** do `MinimalistLayout` (busca e select de estado ao lado do botão Novo)

3. **Ajustar tabela** — usar mesmas classes do Frota (`bg-white/5 border-blue-500/10` em vez de `bg-primary/5 border-primary/10`)

4. **Ajustar AlertDialog** — usar estilo dark (`bg-black/90 border-white/10 backdrop-blur-xl`) igual ao Frota

### Arquivo alterado
- `src/pages/logistica/FreteMinimalista.tsx`

