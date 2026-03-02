
CREATE OR REPLACE FUNCTION public.create_storage_policies(bucket_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy_name_insert text := 'Allow authenticated upload ' || bucket_name;
  policy_name_select text := 'Allow authenticated select ' || bucket_name;
  policy_name_delete text := 'Allow authenticated delete ' || bucket_name;
  policy_name_update text := 'Allow authenticated update ' || bucket_name;
BEGIN
  -- Check if INSERT policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = policy_name_insert
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L)',
      policy_name_insert, bucket_name
    );
  END IF;

  -- Check if SELECT policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = policy_name_select
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L)',
      policy_name_select, bucket_name
    );
  END IF;

  -- Check if DELETE policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = policy_name_delete
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L)',
      policy_name_delete, bucket_name
    );
  END IF;

  -- Check if UPDATE policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = policy_name_update
  ) THEN
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L)',
      policy_name_update, bucket_name
    );
  END IF;
END;
$$;
