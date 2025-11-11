import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CrudResource, CrudAction } from '@/types/permissions';
import { useAuth } from './useAuth';

export function useCrudPermissions(resource: CrudResource) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['crud-permissions', user?.id, resource],
    queryFn: async () => {
      if (!user?.id) {
        return { canCreate: false, canRead: false, canUpdate: false, canDelete: false };
      }

      // Admin tem todas as permissões
      if (isAdmin) {
        return { canCreate: true, canRead: true, canUpdate: true, canDelete: true };
      }

      const { data, error } = await supabase
        .from('user_crud_permissions')
        .select('action')
        .eq('user_id', user.id)
        .eq('resource', resource);

      if (error) throw error;

      const actions = data?.map(row => row.action) || [];
      
      return {
        canCreate: actions.includes('create'),
        canRead: actions.includes('read'),
        canUpdate: actions.includes('update'),
        canDelete: actions.includes('delete')
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook simplificado para verificar uma ação específica
export function useHasCrudPermission(resource: CrudResource, action: CrudAction) {
  const { data, isLoading } = useCrudPermissions(resource);
  
  const permissionKey = `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof typeof data;
  
  return {
    hasPermission: data?.[permissionKey] || false,
    isLoading
  };
}
