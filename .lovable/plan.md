

## Plan: Improve header buttons with glassmorphism styling and remove logout

### Changes in `src/pages/logistica/FrotaMinimalista.tsx`

**1. Remove the LogOut button** (lines 92-99) and remove `LogOut` from the lucide import and `signOut` from `useAuth()`.

**2. Restyle the two remaining buttons** with enhanced glassmorphism:
- **Troca Óleo**: `bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg shadow-white/5 hover:bg-white/20 hover:border-white/30 transition-all duration-300`
- **Novo**: `bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg shadow-white/5 hover:bg-white/25 hover:border-white/35 transition-all duration-300` — slightly brighter to stand out as primary action

### Files affected
- `src/pages/logistica/FrotaMinimalista.tsx`

