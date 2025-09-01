import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface TabAccess {
  id: string;
  key: string;
  label: string;
  href: string;
  permission: string | null;
  tab_group: string;
  sort_order: number;
  active: boolean;
  icon: string | null;
  can_access: boolean;
}

export function useTabsAccess(tabGroup: string = 'sidebar') {
  const queryClient = useQueryClient();

  // Set up real-time updates for permissions and tabs changes
  useEffect(() => {
    const channel = supabase
      .channel('permissions-and-tabs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'role_permissions'
        },
        () => {
          // Invalidate tabs access cache when role permissions change
          queryClient.invalidateQueries({ queryKey: ['tabs-access'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_tab_permissions'
        },
        () => {
          // Invalidate tabs access cache when user-specific permissions change
          queryClient.invalidateQueries({ queryKey: ['tabs-access'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_tabs'
        },
        () => {
          // Invalidate tabs access cache when tabs configuration changes
          queryClient.invalidateQueries({ queryKey: ['tabs-access'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['tabs-access', tabGroup],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_tab_access')
        .select('*')
        .eq('tab_group', tabGroup)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching tabs access:', error);
        throw error;
      }

      return data as TabAccess[];
    },
    staleTime: 10 * 1000, // 10 seconds - reduced for faster updates
    retry: 1,
  });
}