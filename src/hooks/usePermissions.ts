import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppPermission } from '@/types/permissions';

export function usePermissions() {
  return useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error fetching user permissions:', error);
        throw error;
      }

      return data?.map(row => row.permission as AppPermission) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHasPermission(permission: AppPermission) {
  const { data: permissions = [], isLoading } = usePermissions();
  return {
    hasPermission: permissions.includes(permission),
    isLoading
  };
}