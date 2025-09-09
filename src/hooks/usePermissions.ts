import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppPermission } from '@/types/permissions';
import { useEffect } from 'react';

export function usePermissions() {
  const queryClient = useQueryClient();

  // Set up real-time updates for role permissions changes
  useEffect(() => {
    const channel = supabase
      .channel('role-permissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'role_permissions'
        },
        () => {
          // Invalidate user permissions cache when role permissions change
          queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
    staleTime: 10 * 1000, // 10 seconds - reduced for faster updates
    retry: 1,
  });
}

export function useHasPermission(permission: AppPermission) {
  const { data: permissions = [], isLoading } = usePermissions();
  return {
    hasPermission: permissions.includes(permission),
    isLoading
  };
}