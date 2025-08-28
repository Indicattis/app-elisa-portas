import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { AppPermission } from '@/types/permissions';

export function useUserPermissions() {
  const { user, isAdmin } = useAuth();
  const { getUserRoles, getRolePermissions } = usePermissions();

  const hasPermission = (permission: AppPermission): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    
    const userRoles = getUserRoles(user.id);
    return userRoles.some(role => 
      getRolePermissions(role).includes(permission)
    );
  };

  const hasAnyPermission = (permissions: AppPermission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission
  };
}