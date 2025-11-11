import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CRUD_RESOURCE_LABELS, CRUD_ACTION_LABELS, CrudResource, CrudAction } from "@/types/permissions";
import { useAllUsers } from "@/hooks/useAllUsers";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function PermissoesCRUD() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: users } = useAllUsers();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-crud-permissions', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      
      const { data, error } = await supabase
        .from('user_crud_permissions')
        .select('*')
        .eq('user_id', selectedUserId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId
  });

  const updateMutation = useMutation({
    mutationFn: async ({ resource, action, enabled }: {
      resource: CrudResource;
      action: CrudAction;
      enabled: boolean;
    }) => {
      if (enabled) {
        const { error } = await supabase
          .from('user_crud_permissions')
          .insert({ 
            user_id: selectedUserId, 
            resource, 
            action 
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_crud_permissions')
          .delete()
          .eq('user_id', selectedUserId)
          .eq('resource', resource)
          .eq('action', action);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-crud-permissions'] });
      toast.success('Permissão atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar permissão: ' + error.message);
    }
  });

  const hasPermission = (resource: CrudResource, action: CrudAction) => {
    return permissions?.some(
      p => p.resource === resource && p.action === action
    ) || false;
  };

  const selectedUser = users?.find(u => u.user_id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões CRUD por Usuário</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Configure permissões individuais de Criar, Ler, Atualizar e Excluir para cada usuário
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Administradores têm todas as permissões automaticamente. Configure aqui apenas permissões específicas para usuários não-admin.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Usuário</label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um usuário..." />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.nome} - {user.email} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUser && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Cargo: {selectedUser.role}</Badge>
            <Badge variant="outline">Email: {selectedUser.email}</Badge>
          </div>
        )}

        {selectedUserId && !isLoading && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Recurso</TableHead>
                  {Object.entries(CRUD_ACTION_LABELS).map(([key, label]) => (
                    <TableHead key={key} className="text-center font-semibold">{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(CRUD_RESOURCE_LABELS).map(([resourceKey, resourceLabel]) => (
                  <TableRow key={resourceKey}>
                    <TableCell className="font-medium">{resourceLabel}</TableCell>
                    {Object.keys(CRUD_ACTION_LABELS).map((actionKey) => (
                      <TableCell key={actionKey} className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={hasPermission(resourceKey as CrudResource, actionKey as CrudAction)}
                            onCheckedChange={(checked) => 
                              updateMutation.mutate({
                                resource: resourceKey as CrudResource,
                                action: actionKey as CrudAction,
                                enabled: checked as boolean
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedUserId && isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
