

## Plan: Restyle TrocaOleoDialog with glassmorphism minimalist design

Rewrite `src/components/frota/TrocaOleoDialog.tsx` applying the same dark glassmorphism style used across all fleet pages. The logic and functionality remain identical.

### Changes in `src/components/frota/TrocaOleoDialog.tsx`

**DialogContent**: Apply `bg-black/80 backdrop-blur-xl border-white/10 text-white` (replacing default theme).

**Header**: Style title text white, description `text-white/60`, Droplet icon `text-blue-400`.

**Form inputs** (Select triggers, date button, disabled inputs): Use the standard `inputClass` pattern: `bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-400/40`.

**Labels**: `text-white/70 text-xs`.

**SelectContent / PopoverContent (Calendar)**: Dark dropdown styling `bg-black/90 border-white/10 backdrop-blur-xl`, items with `text-white focus:bg-white/10 focus:text-white`.

**Disabled info fields** (KM Atual, KM Próxima Troca, Data Próxima Troca): `bg-white/5 border-white/10 text-white/50` instead of `bg-muted`.

**Border separator**: `border-white/10` instead of `border-t`.

**Footer buttons**:
- Cancel: `bg-white/5 border-white/10 text-white hover:bg-white/10`
- Submit: `bg-blue-500/15 backdrop-blur-md border border-blue-500/25 text-white hover:bg-blue-500/25 hover:border-blue-400/35`

Single file change, no structural or logic modifications.

