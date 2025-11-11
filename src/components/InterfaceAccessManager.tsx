import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { UserRole, InterfaceType, ROLE_LABELS, INTERFACE_LABELS } from '@/types/permissions';
import { ShieldAlert, Monitor } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function InterfaceAccessManager() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('atendente');
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Fetch interface access for selected role
  const { data: accessData = [], isLoading } = useQuery({
    queryKey: ['role-interface-access', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_interface_access')
        .select('interface')
        .eq('role', selectedRole);

      if (error) throw error;
      return data?.map(row => row.interface as InterfaceType) || [];
    },
  });

  // Mutation to update interface access
  const updateAccess = useMutation({
    mutationFn: async ({ role, interfaces }: { role: UserRole; interfaces: InterfaceType[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Remove all existing access for this role
      await supabase
        .from('role_interface_access')
        .delete()
        .eq('role', role);

      // Insert new access
      if (interfaces.length > 0) {
        const { error } = await supabase
          .from('role_interface_access')
          .insert(
            interfaces.map(interfaceType => ({
              role,
              interface: interfaceType,
              created_by: user?.id
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-interface-access'] });
      queryClient.invalidateQueries({ queryKey: ['interface-access'] });
      toast.success('Permissões de interface atualizadas!');
    },
    onError: (error) => {
      console.error('Error updating interface access:', error);
      toast.error('Erro ao atualizar permissões de interface');
    },
  });

  const handleToggle = (interfaceType: InterfaceType, checked: boolean) => {
    let newInterfaces = [...accessData];
    
    if (checked) {
      if (!newInterfaces.includes(interfaceType)) {
        newInterfaces.push(interfaceType);
      }
    } else {
      newInterfaces = newInterfaces.filter(i => i !== interfaceType);
    }

    updateAccess.mutate({
      role: selectedRole,
      interfaces: newInterfaces
    });
  };

  const roles = Object.keys(ROLE_LABELS) as UserRole[];
  const interfaces = Object.keys(INTERFACE_LABELS) as InterfaceType[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          <CardTitle>Gerenciar Acesso a Interfaces por Cargo</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Configure quais interfaces (páginas principais) cada cargo pode acessar. Exemplo: interface de Produção.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Apenas administradores podem modificar permissões de acesso a interfaces.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Role Selector */}
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

        {/* Interface List */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold mb-3">Interfaces Disponíveis</h3>
          {interfaces.map(interfaceType => (
            <div 
              key={interfaceType}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={accessData.includes(interfaceType)}
                onCheckedChange={(checked) => handleToggle(interfaceType, checked as boolean)}
                disabled={updateAccess.isPending || isLoading || !isAdmin}
              />
              <div className="flex-1">
                <label className="text-sm font-medium cursor-pointer">
                  {INTERFACE_LABELS[interfaceType]}
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Interface: /{interfaceType.replace('_home', '').replace('_', '-')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {accessData.length} de {interfaces.length} interfaces liberadas
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                updateAccess.mutate({
                  role: selectedRole,
                  interfaces: []
                });
              }}
              disabled={updateAccess.isPending || accessData.length === 0 || !isAdmin}
            >
              Remover Todas
            </Button>
            <Button
              onClick={() => {
                updateAccess.mutate({
                  role: selectedRole,
                  interfaces: interfaces
                });
              }}
              disabled={updateAccess.isPending || accessData.length === interfaces.length || !isAdmin}
            >
              Liberar Todas
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
