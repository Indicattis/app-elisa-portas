import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TabAccess {
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
  const [tabs, setTabs] = useState<TabAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchTabs() {
      if (!user) {
        setTabs([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_tab_access')
          .select('*')
          .eq('tab_group', tabGroup)
          .order('sort_order');

        if (error) {
          console.error('Error fetching tabs:', error);
          setTabs([]);
        } else {
          setTabs(data || []);
        }
      } catch (error) {
        console.error('Error fetching tabs:', error);
        setTabs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTabs();
  }, [user, tabGroup]);

  return { tabs, loading };
}