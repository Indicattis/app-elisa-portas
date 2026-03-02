
# Corrigir criacao de categorias (buckets) no Storage

## Problema
A API `supabase.storage.createBucket()` requer privilegios de `service_role`. O client-side usa a `anon` key, que nao tem permissao para criar buckets, resultando em erro 400.

## Solucao
Criar uma edge function que recebe o nome do bucket e o cria usando a `service_role` key no servidor.

### 1. Criar edge function `create-storage-bucket`
**Arquivo:** `supabase/functions/create-storage-bucket/index.ts`
- Receber `{ name: string }` no body da requisicao
- Validar que o nome nao esta vazio
- Usar `createClient` com `SUPABASE_SERVICE_ROLE_KEY` para criar o bucket como publico
- Retornar sucesso ou erro

### 2. Atualizar `MidiasMinimalista.tsx`
- Substituir a chamada `supabase.storage.createBucket(name, { public: true })` por uma invocacao da edge function via `supabase.functions.invoke('create-storage-bucket', { body: { name } })`
- Tratar a resposta da mesma forma (toast de sucesso/erro)

### Detalhes tecnicos
A edge function usara o `SUPABASE_SERVICE_ROLE_KEY` que ja esta disponivel automaticamente como variavel de ambiente nas edge functions do Supabase, sem necessidade de configurar secrets adicionais.
