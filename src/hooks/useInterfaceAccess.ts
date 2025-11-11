import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InterfaceType } from '@/types/permissions';
import { useAuth } from './useAuth';

export function useInterfaceAccess(interfaceType: InterfaceType) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['interface-access', user?.id, interfaceType, isAdmin],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Admin tem acesso a tudo
      if (isAdmin) {
        console.log('[useInterfaceAccess] Admin tem acesso total:', interfaceType);
        return true;
      }

      console.log('[useInterfaceAccess] Verificando acesso para:', { user_id: user.id, interface: interfaceType });

      const { data, error } = await supabase.rpc('has_interface_access', {
        _user_id: user.id,
        _interface: interfaceType
      });

      if (error) {
        console.error('[useInterfaceAccess] Erro ao verificar acesso:', error);
        throw error;
      }

      console.log('[useInterfaceAccess] Resultado:', data);
      return data || false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
