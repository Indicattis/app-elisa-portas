

## Plan: Unified timeline showing conferences and file uploads

Currently the history page shows conferences in a grid and files in a separate section below. The goal is to merge both into a single chronological timeline so file uploads appear as history events alongside conferences.

### Approach: Frontend merge (no DB changes needed)

Both `conferencias` and `arquivos` are already fetched on the page. We'll merge them into a single sorted timeline.

### Changes to `FrotaConferenciasHistoricoMinimalista.tsx`

1. **Create a unified timeline array** merging conferences and file uploads, sorted by `created_at` descending. Each item has a `type: 'conferencia' | 'arquivo'` discriminator.

2. **Replace the two separate sections** (conference grid + files section) with a single timeline grid:
   - **Conference items**: Render exactly as today (photo card with km, status, date, etc.)
   - **File items**: Render as a compact card with a file icon (FileText/Paperclip), file name, size, date, and download/delete actions — styled consistently as a glassmorphism card in the same grid

3. **Keep the upload button** in a header area above the timeline (with the "Anexar arquivo" button).

4. **Visual differentiation**: File cards get a small "Arquivo anexado" label/badge to distinguish from conference cards. No photo section — instead show a large file icon area.

5. **Subtitle** updated to reflect total events: `${timeline.length} registros no histórico`.

### Single file change
Only `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx` is modified. No database or hook changes required.

