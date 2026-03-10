

## Plan: Add WhatsApp Roulette Clicks Listing Section

Add a new section at the end of `/marketing/performance` (PerformanceMinimalista.tsx) that displays a table listing individual WhatsApp roulette clicks.

### What will be built
A Card at the bottom of the page with:
- Title "Cliques da Roleta WhatsApp" with a Phone icon
- A table showing each click with columns: Data/Hora, Atendente, Canal, UTM Source, UTM Campaign, Referrer
- Uses the existing `whatsAppClicks` state (already fetched in `fetchWhatsAppData`)
- Styled consistently with the rest of the page (dark theme, white/70 text)

### Technical details
- **File**: `src/pages/marketing/PerformanceMinimalista.tsx`
- Insert a new `<Card>` block after the CAC section (after line ~1015), before the closing `</MinimalistLayout>`
- Reuse the `whatsAppClicks` state and `loadingWhatsApp` already available
- Format `created_at` with `date-fns` (already imported)
- Show traffic channel classification based on existing logic (fbclid/gclid/utm_source)
- No new data fetching needed -- all data is already loaded

