import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InterfaceType } from '@/types/permissions';
import { useAuth } from './useAuth';

export function useInterfaceAccess(interfaceType: InterfaceType) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['interface-access', user?.id, interfaceType],
    queryFn: async () => {
      if (!user?.id) return false;
      if (isAdmin) return true; // Admin tem acesso a tudo

      const { data, error } = await supabase.rpc('has_interface_access', {
        _user_id: user.id,
        _interface: interfaceType
      });

      if (error) throw error;
      return data || false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
