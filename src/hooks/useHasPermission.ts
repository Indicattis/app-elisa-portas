import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { AppPermission } from '@/types/permissions';

export function useHasPermission(permission: AppPermission): boolean {
  const { user } = useAuth();
  const { getUserRoles, getRolePermissions, loading } = usePermissions();

  return useMemo(() => {
    if (!user || loading) {
      return false;
    }
    
    const userRoles = getUserRoles(user.id);
    return userRoles.some(role => {
      const rolePermissions = getRolePermissions(role);
      return rolePermissions.includes(permission);
    });
  }, [user, loading, permission, getUserRoles, getRolePermissions]);
}