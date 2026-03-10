

## Plan: Add file attachments to vehicle history page

The history page (`/logistica/frota/:id/conferencias`) currently only shows conference records. We need to add a section for attaching files (documents, images, PDFs) to the vehicle, with upload, list, and delete capabilities.

### 1. Create `veiculos_arquivos` table (migration)

```sql
create table public.veiculos_arquivos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references public.veiculos(id) on delete cascade not null,
  nome text not null,
  url text not null,
  tipo text, -- mime type
  tamanho bigint, -- file size in bytes
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.veiculos_arquivos enable row level security;

create policy "Authenticated users can manage vehicle files"
  on public.veiculos_arquivos for all
  to authenticated
  using (true)
  with check (true);
```

### 2. Create hook `src/hooks/useVeiculoArquivos.ts`

- Fetch all files for a given `veiculo_id` from `veiculos_arquivos`
- Upload mutation: upload to `documentos-publicos` bucket, insert row into table
- Delete mutation: delete from storage + delete row from table
- Standard react-query pattern matching existing hooks

### 3. Update `FrotaConferenciasHistoricoMinimalista.tsx`

Add a new section below the conference grid (or as a tab/section header) with:
- "Arquivos" section title with upload button in the header
- File list showing name, date, size with download link and delete button
- Upload area: hidden file input triggered by button, accepts any file type
- Glassmorphism styling matching existing cards (`bg-white/5 border-blue-500/10 backdrop-blur-xl`)
- Each file row shows: file icon, name (truncated), date, size, download/delete actions

### Files affected
- **Migration**: new `veiculos_arquivos` table
- **New**: `src/hooks/useVeiculoArquivos.ts`
- **Edit**: `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx`

