create table public.veiculos_arquivos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid references public.veiculos(id) on delete cascade not null,
  nome text not null,
  url text not null,
  tipo text,
  tamanho bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.veiculos_arquivos enable row level security;

create policy "Authenticated users can manage vehicle files"
  on public.veiculos_arquivos for all
  to authenticated
  using (true)
  with check (true);