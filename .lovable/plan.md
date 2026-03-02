

# Aplicar politicas RLS a todos os buckets existentes

## Problema
A funcao `create_storage_policies` foi criada recentemente, mas so e chamada ao criar novos buckets. Buckets criados anteriormente (como `fotos-portas`, `catalogo-produtos`, `contratos-vendas`, etc.) nao possuem politicas RLS, causando erro 400 em qualquer upload.

## Solucao
Criar uma migracao SQL que execute `create_storage_policies()` para todos os buckets existentes que ainda nao possuem politicas de INSERT/SELECT/DELETE/UPDATE.

### Migracao SQL

Executar a funcao `create_storage_policies` para cada bucket que nao possui a politica de INSERT:

```text
SELECT public.create_storage_policies(id)
FROM storage.buckets
WHERE id NOT IN (
  SELECT replace(policyname, 'Allow authenticated upload ', '')
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'Allow authenticated upload %'
);
```

Isso cobrira todos os buckets existentes de uma vez: `fotos-portas`, `catalogo-produtos`, `chamados-suporte-anexos`, `comprovantes-pagamento`, `contas-pagar`, `contratos-autorizados`, `contratos-vendas`, `documentos-publicos`, `fotos-carregamento`, `lead-anexos`, `projetos-realizados`, `user-avatars`, `veiculos-fotos`.

Buckets que ja possuem politicas (como `projetos`) serao ignorados pela logica `IF NOT EXISTS` dentro da funcao.

### Resultado esperado
Apos a migracao, todos os buckets terao politicas RLS permitindo que usuarios autenticados facam upload, leitura, exclusao e atualizacao de arquivos.
