import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, AppPermission, UserRoleAssignment, RolePermission } from '@/types/permissions';
import { useToast } from '@/hooks/use-toast';

export function usePermissions() {
  const [userRoles, setUserRoles] = useState<UserRoleAssignment[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      
      // Buscar roles dos usuários
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Buscar permissões por role
      const { data: permissions, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true });

      if (permissionsError) throw permissionsError;

      setUserRoles(roles || []);
      setRolePermissions(permissions || []);
      
      console.log('Permissões carregadas:', {
        userRoles: roles || [],
        rolePermissions: permissions || []
      });
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar permissões do sistema'
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRoleToUser = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          created_by: user?.id
        });

      if (error) throw error;

      await fetchPermissions();
      
      toast({
        title: 'Sucesso',
        description: 'Role atribuída ao usuário com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao atribuir role:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message?.includes('duplicate') 
          ? 'Usuário já possui esta role'
          : 'Erro ao atribuir role ao usuário'
      });
    }
  };

  const removeRoleFromUser = async (userRoleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);

      if (error) throw error;

      await fetchPermissions();
      
      toast({
        title: 'Sucesso',
        description: 'Role removida do usuário com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover role:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao remover role do usuário'
      });
    }
  };

  const updateRolePermission = async (role: UserRole, permission: AppPermission, hasPermission: boolean) => {
    try {
      if (hasPermission) {
        // Adicionar permissão
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role,
            permission,
            created_by: user?.id
          });

        if (error) throw error;
      } else {
        // Remover permissão
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role)
          .eq('permission', permission);

        if (error) throw error;
      }

      await fetchPermissions();
      
      toast({
        title: 'Sucesso',
        description: `Permissão ${hasPermission ? 'adicionada' : 'removida'} com sucesso`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message?.includes('duplicate')
          ? 'Esta permissão já existe para esta role'
          : 'Erro ao atualizar permissão'
      });
    }
  };

  const getUserRoles = (userId: string): UserRole[] => {
    return userRoles
      .filter(ur => ur.user_id === userId)
      .map(ur => ur.role);
  };

  const getRolePermissions = (role: UserRole): AppPermission[] => {
    return rolePermissions
      .filter(rp => rp.role === role)
      .map(rp => rp.permission);
  };

  const hasPermission = (userId: string, permission: AppPermission): boolean => {
    const userRolesList = getUserRoles(userId);
    return userRolesList.some(role => getRolePermissions(role).includes(permission));
  };

  return {
    userRoles,
    rolePermissions,
    loading,
    fetchPermissions,
    assignRoleToUser,
    removeRoleFromUser,
    updateRolePermission,
    getUserRoles,
    getRolePermissions,
    hasPermission
  };
}