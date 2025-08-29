import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}