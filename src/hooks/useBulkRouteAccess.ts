import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useBulkRouteAccess(prefixes: string[]) {
  const { user, hasBypassPermissions } = useAuth();

  return useQuery({
    queryKey: ['bulk-route-access', user?.id, prefixes, hasBypassPermissions],
    queryFn: async () => {
      if (!user?.id) return {} as Record<string, boolean>;

      if (hasBypassPermissions) {
        return prefixes.reduce((acc, p) => ({ ...acc, [p]: true }), {} as Record<string, boolean>);
      }

      const { data, error } = await supabase
        .from('user_route_access' as any)
        .select('route_key')
        .eq('user_id', user.id)
        .eq('can_access', true);

      if (error) throw error;

      const keys = (data || []).map((r: any) => r.route_key as string);
      
      return prefixes.reduce((acc, prefix) => {
        acc[prefix] = keys.some(k => k.startsWith(prefix));
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: !!user?.id && prefixes.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
