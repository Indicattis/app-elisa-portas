import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, User } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole, AppPermission, ROLE_LABELS, PERMISSION_LABELS } from "@/types/permissions";

export function PermissionsTab() {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const { rolePermissions, updateRolePermission, loading } = usePermissions();

  const roles: UserRole[] = [
    'administrador', 'diretor', 'gerente_comercial', 'gerente_marketing', 
    'gerente_financeiro', 'gerente_producao', 'gerente_fabril', 'gerente_instalacoes',
    'coordenador_vendas', 'vendedor', 'analista_marketing', 'assistente_marketing',
    'assistente_administrativo', 'atendente', 'instalador', 'aux_instalador',
    'soldador', 'pintor', 'aux_pintura', 'aux_geral'
  ];

  const getRolePermissions = (role: UserRole): AppPermission[] => {
    return rolePermissions
      .filter(rp => rp.role === role)
      .map(rp => rp.permission);
  };

  const hasPermission = (role: UserRole, permission: AppPermission): boolean => {
    return getRolePermissions(role).includes(permission);
  };

  const handlePermissionToggle = async (role: UserRole, permission: AppPermission, enabled: boolean) => {
    await updateRolePermission(role, permission, enabled);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Carregando permissões...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gerenciamento de Permissões
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecione uma função para configurar quais páginas ela pode acessar
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role-select">Selecionar Função</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | "")}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Escolha uma função..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {ROLE_LABELS[role]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {ROLE_LABELS[selectedRole as UserRole]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    • {getRolePermissions(selectedRole as UserRole).length} permissões ativas
                  </span>
                </div>

                <div className="grid gap-4">
                  <h4 className="font-medium text-sm">Páginas Disponíveis</h4>
                  
                  <div className="grid gap-3">
                    {Object.values(PERMISSION_LABELS).map((permissionInfo) => (
                      <div
                        key={permissionInfo.key}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {permissionInfo.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {permissionInfo.description}
                          </div>
                        </div>
                        
                        <Switch
                          checked={hasPermission(selectedRole as UserRole, permissionInfo.key)}
                          onCheckedChange={(checked) => 
                            handlePermissionToggle(selectedRole as UserRole, permissionInfo.key, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}