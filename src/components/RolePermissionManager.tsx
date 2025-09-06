import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserRole, AppPermission, ROLE_LABELS, PERMISSION_LABELS } from '@/types/permissions';

export function RolePermissionManager() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('atendente');
  const queryClient = useQueryClient();

  // Fetch role permissions
  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', selectedRole);

      if (error) throw error;
      return data?.map(row => row.permission as AppPermission) || [];
    },
  });

  // Mutation to update permissions
  const updatePermissions = useMutation({
    mutationFn: async ({ role, permissions }: { role: UserRole; permissions: AppPermission[] }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Remove all existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role);

      // Insert new permissions
      if (permissions.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(
            permissions.map(permission => ({
              role,
              permission,
              created_by: user?.id
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['tabs-access'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast.success('Permissões atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating permissions:', error);
      toast.error('Erro ao atualizar permissões');
    },
  });

  const handlePermissionChange = (permission: AppPermission, checked: boolean) => {
    const newPermissions = checked
      ? [...rolePermissions, permission]
      : rolePermissions.filter(p => p !== permission);

    updatePermissions.mutate({
      role: selectedRole,
      permissions: newPermissions
    });
  };

  const roles = Object.keys(ROLE_LABELS) as UserRole[];
  const permissions = Object.keys(PERMISSION_LABELS) as AppPermission[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Permissões por Cargo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Selecionar Cargo</label>
          <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-4">Permissões para {ROLE_LABELS[selectedRole]}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.map(permission => {
              const permissionInfo = PERMISSION_LABELS[permission];
              const isChecked = rolePermissions.includes(permission);

              return (
                <div key={permission} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={permission}
                    checked={isChecked}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission, checked as boolean)
                    }
                    disabled={updatePermissions.isPending || isLoading}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={permission}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {permissionInfo.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {permissionInfo.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              // Clear all permissions for selected role
              updatePermissions.mutate({
                role: selectedRole,
                permissions: []
              });
            }}
            disabled={updatePermissions.isPending || rolePermissions.length === 0}
          >
            Remover Todas
          </Button>
          <Button
            onClick={() => {
              // Grant all permissions for selected role
              updatePermissions.mutate({
                role: selectedRole,
                permissions: permissions
              });
            }}
            disabled={updatePermissions.isPending || rolePermissions.length === permissions.length}
          >
            Conceder Todas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}