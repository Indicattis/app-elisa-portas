import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useRouteAccess(routeKey: string) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['route-access', user?.id, routeKey],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Admin tem acesso a tudo
      if (isAdmin) {
        return true;
      }

      const { data, error } = await supabase.rpc('has_route_access', {
        _user_id: user.id,
        _route_key: routeKey
      });

      if (error) throw error;
      return data || false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
