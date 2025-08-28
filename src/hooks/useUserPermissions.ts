import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { AppPermission } from '@/types/permissions';

export function useUserPermissions() {
  const { user, isAdmin } = useAuth();
  const { getUserRoles, getRolePermissions, loading } = usePermissions();

  const hasPermission = (permission: AppPermission): boolean => {
    if (!user) {
      console.log('useUserPermissions: Usuário não está logado');
      return false;
    }
    
    if (isAdmin) {
      console.log('useUserPermissions: Usuário é admin, permitindo acesso');
      return true;
    }
    
    const userRoles = getUserRoles(user.id);
    console.log('useUserPermissions: Roles do usuário:', userRoles);
    
    const hasAccess = userRoles.some(role => {
      const rolePermissions = getRolePermissions(role);
      console.log(`useUserPermissions: Permissões da role ${role}:`, rolePermissions);
      return rolePermissions.includes(permission);
    });
    
    console.log(`useUserPermissions: Verificando permissão "${permission}":`, hasAccess);
    return hasAccess;
  };

  const hasAnyPermission = (permissions: AppPermission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
    loading
  };
}