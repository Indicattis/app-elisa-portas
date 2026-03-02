SELECT public.create_storage_policies(id)
FROM storage.buckets
WHERE id NOT IN (
  SELECT replace(policyname, 'Allow authenticated upload ', '')
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'Allow authenticated upload %'
);