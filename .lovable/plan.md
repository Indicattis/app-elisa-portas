

## Plan: Restyle `/logistica/frota` with glassmorphism

The current page already has a dark theme but uses `bg-primary/5 border-primary/10` styling. The goal is to align it with the glassmorphism pattern used across other minimalist pages (`bg-white/5 border-white/10 backdrop-blur-xl`).

### Changes to `src/pages/logistica/FrotaMinimalista.tsx`

**Card wrapper**: Change `bg-primary/5 border-primary/10 backdrop-blur-xl` to `bg-white/5 border-white/10 backdrop-blur-xl`

**Table header row**: Change `border-primary/10 hover:bg-primary/5` to `border-white/10 hover:bg-white/5`

**Table header cells**: Change `text-white/70` styling — keep as-is (already correct)

**Table body rows**: Change `border-primary/10 hover:bg-primary/10` to `border-white/10 hover:bg-white/5`

**Header bar**: Change `border-b border-primary/10` to `border-b border-white/10`

**Back button**: Change `hover:bg-primary/10` to `hover:bg-white/10`

**Action buttons in header**:
- Troca Óleo button: `border-white/20 bg-white/10 text-white hover:bg-white/15`
- Novo button: `bg-white/10 hover:bg-white/15 text-white border border-white/20`
- LogOut button: `hover:bg-white/10`

**Photo placeholder**: Change `bg-primary/20` to `bg-white/10`

**Row action buttons**: Change `hover:bg-primary/20` to `hover:bg-white/10`

**Loading spinner**: Change `border-primary` to `border-white/70`

**AlertDialog**: Style with `bg-black/90 border-white/10 backdrop-blur-xl` for dark glassmorphism consistency

### Files affected
- `src/pages/logistica/FrotaMinimalista.tsx` — restyle all classes from primary-based to white-based glassmorphism

