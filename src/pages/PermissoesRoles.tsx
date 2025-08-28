import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Users, Settings, FileText, Calculator, Factory, TrendingUp, Calendar, DollarSign, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
}

const permissions: Permission[] = [
  {
    id: 'leads_view',
    name: 'Visualizar Leads',
    description: 'Pode visualizar a lista de leads',
    category: 'Leads',
    icon: FileText
  },
  {
    id: 'leads_create',
    name: 'Criar Leads',
    description: 'Pode criar novos leads',
    category: 'Leads',
    icon: FileText
  },
  {
    id: 'leads_edit',
    name: 'Editar Leads',
    description: 'Pode editar leads existentes',
    category: 'Leads',
    icon: FileText
  },
  {
    id: 'orcamentos_view',
    name: 'Visualizar Orçamentos',
    description: 'Pode visualizar orçamentos',
    category: 'Orçamentos',
    icon: Calculator
  },
  {
    id: 'orcamentos_create',
    name: 'Criar Orçamentos',
    description: 'Pode criar novos orçamentos',
    category: 'Orçamentos',
    icon: Calculator
  },
  {
    id: 'orcamentos_approve',
    name: 'Aprovar Orçamentos',
    description: 'Pode aprovar orçamentos',
    category: 'Orçamentos',
    icon: Calculator
  },
  {
    id: 'producao_view',
    name: 'Visualizar Produção',
    description: 'Pode visualizar área de produção',
    category: 'Produção',
    icon: Factory
  },
  {
    id: 'producao_manage',
    name: 'Gerenciar Produção',
    description: 'Pode gerenciar ordens de produção',
    category: 'Produção',
    icon: Factory
  },
  {
    id: 'marketing_view',
    name: 'Visualizar Marketing',
    description: 'Pode visualizar dados de marketing',
    category: 'Marketing',
    icon: TrendingUp
  },
  {
    id: 'users_manage',
    name: 'Gerenciar Usuários',
    description: 'Pode gerenciar usuários do sistema',
    category: 'Sistema',
    icon: Users
  },
  {
    id: 'configuracoes',
    name: 'Configurações',
    description: 'Pode acessar configurações do sistema',
    category: 'Sistema',
    icon: Settings
  }
];

const roles = [
  {
    id: 'administrador',
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    color: 'destructive'
  },
  {
    id: 'gerente_comercial',
    name: 'Gerente Comercial',
    description: 'Gerencia área comercial',
    color: 'default'
  },
  {
    id: 'gerente_fabril',
    name: 'Gerente Fabril',
    description: 'Gerencia área de produção',
    color: 'secondary'
  },
  {
    id: 'atendente',
    name: 'Atendente',
    description: 'Atendimento e vendas',
    color: 'outline'
  }
];

export default function PermissoesRoles() {
  const [selectedRole, setSelectedRole] = useState('atendente');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions(prev => {
      if (checked) {
        return [...prev, permissionId];
      } else {
        return prev.filter(id => id !== permissionId);
      }
    });
  };

  const savePermissions = async () => {
    // Here you would implement the logic to save permissions
    toast.success('Permissões atualizadas com sucesso');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Roles</h1>
          <p className="text-muted-foreground">Configure permissões por função</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Funções
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole === role.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{role.name}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                  <Badge variant={role.color as any}>
                    {role.name}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permissões */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                Permissões para {roles.find(r => r.id === selectedRole)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-4">
                  <h3 className="font-medium text-lg border-b pb-2">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <permission.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                            {permission.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                        <Switch
                          id={permission.id}
                          checked={rolePermissions.includes(permission.id)}
                          onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={savePermissions}>
                  Salvar Permissões
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}