
# Corrigir erro 400 no upload de midias para buckets novos

## Problema
Quando um bucket e criado via edge function, ele nao possui politicas RLS (Row Level Security) no `storage.objects`. O Supabase Storage exige politicas RLS para permitir operacoes como INSERT (upload), SELECT (download) e DELETE. Sem essas politicas, qualquer upload retorna 400 Bad Request.

## Solucao
Atualizar a edge function `create-storage-bucket` para, apos criar o bucket, tambem criar as politicas RLS necessarias usando SQL via o admin client.

### Arquivo: `supabase/functions/create-storage-bucket/index.ts`

Apos criar o bucket com sucesso (ou se ja existir), executar queries SQL para criar 3 politicas RLS no `storage.objects`:

1. **SELECT** - permitir que usuarios autenticados leiam arquivos do bucket
2. **INSERT** - permitir que usuarios autenticados facam upload no bucket
3. **DELETE** - permitir que usuarios autenticados excluam arquivos do bucket

As politicas usarao `bucket_id = '<nome_do_bucket>'` como filtro e serao criadas com `IF NOT EXISTS` (via nome unico por bucket) para evitar erros em buckets ja existentes.

### Detalhes tecnicos

A edge function executara via `supabaseAdmin.rpc` ou diretamente via `supabaseAdmin.from('...')` as seguintes queries SQL apos a criacao do bucket:

```text
CREATE POLICY "Allow authenticated upload <bucket>" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = '<bucket>');

CREATE POLICY "Allow authenticated select <bucket>" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = '<bucket>');

CREATE POLICY "Allow authenticated delete <bucket>" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = '<bucket>');
```

Como o admin client usa `service_role`, ele tem permissao para executar essas queries. Sera utilizado `supabaseAdmin.rpc('exec_sql', ...)` ou a REST API do Postgres diretamente via fetch para o endpoint `/rest/v1/rpc/`.

Na pratica, a forma mais simples e usar o metodo `supabaseAdmin.rpc` com uma funcao SQL auxiliar ou executar as queries diretamente via a API SQL do Supabase (`/pg/query` endpoint nao disponivel). A alternativa viavel e criar uma funcao SQL `create_storage_policies(bucket_name text)` no banco via migracao, e chama-la da edge function.

### Plano de execucao

1. **Migracao SQL**: Criar uma funcao `public.create_storage_policies(bucket_name text)` com `SECURITY DEFINER` que cria as 3 politicas RLS para o bucket informado
2. **Atualizar edge function**: Apos criar o bucket, chamar `supabaseAdmin.rpc('create_storage_policies', { bucket_name: name.trim() })`
