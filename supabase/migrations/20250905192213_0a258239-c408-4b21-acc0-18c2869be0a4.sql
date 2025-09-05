-- Create function to perform database vacuum
CREATE OR REPLACE FUNCTION public.perform_database_vacuum()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Execute VACUUM FULL on tables that had large base64 data
  EXECUTE 'VACUUM FULL admin_users, autorizados';
  
  RETURN 'Database vacuum completed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'VACUUM failed: ' || SQLERRM;
END;
$function$;

-- Create function to analyze storage usage
CREATE OR REPLACE FUNCTION public.analyze_database_storage()
RETURNS TABLE(
  table_name text,
  size_pretty text,
  size_bytes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tablename::text as table_name,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size_pretty,
    pg_total_relation_size('public.'||tablename) as size_bytes
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size('public.'||tablename) DESC;
END;
$function$;

-- Create function to count remaining base64 images
CREATE OR REPLACE FUNCTION public.count_base64_images()
RETURNS TABLE(
  table_name text,
  base64_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'admin_users'::text as table_name,
    COUNT(*)::bigint as base64_count
  FROM admin_users 
  WHERE foto_perfil_url LIKE 'data:image%'
  UNION ALL
  SELECT 
    'autorizados'::text as table_name,
    COUNT(*)::bigint as base64_count
  FROM autorizados 
  WHERE logo_url LIKE 'data:image%';
END;
$function$;