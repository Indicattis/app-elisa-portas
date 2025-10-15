import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Key, AlertCircle } from 'lucide-react';
import { UserRole, ROLE_LABELS } from '@/types/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function RoleManager() {
  // Fetch user counts per role
  const { data: roleCounts = [], isLoading: loadingCounts } = useQuery({
    queryKey: ['role-user-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('ativo', true);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((user) => {
        if (user.role) {
          counts[user.role] = (counts[user.role] || 0) + 1;
        }
      });

      return Object.entries(counts).map(([role, count]) => ({
        role: role as UserRole,
        count,
      }));
    },
  });

  // Fetch permission counts per role
  const { data: permissionCounts = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['role-permission-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((perm) => {
        counts[perm.role] = (counts[perm.role] || 0) + 1;
      });

      return Object.entries(counts).map(([role, count]) => ({
        role: role as UserRole,
        count,
      }));
    },
  });

  const roles = Object.keys(ROLE_LABELS) as UserRole[];
  const isLoading = loadingCounts || loadingPermissions;

  const getUserCount = (role: UserRole) => {
    return roleCounts.find((r) => r.role === role)?.count || 0;
  };

  const getPermissionCount = (role: UserRole) => {
    return permissionCounts.find((r) => r.role === role)?.count || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gerenciar Cargos
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Visualize os cargos disponíveis no sistema e suas estatísticas.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Roles List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando cargos...
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-primary" />
                    <div>
                      <h4 className="font-medium">{ROLE_LABELS[role]}</h4>
                      <p className="text-xs text-muted-foreground">
                        Chave: <code className="bg-muted px-1 py-0.5 rounded">{role}</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="secondary">{getUserCount(role)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">usuários</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="outline">{getPermissionCount(role)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">permissões</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Section */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-medium">Como adicionar um novo cargo:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Novos cargos devem ser adicionados via migração SQL ao enum <code className="bg-muted px-1 py-0.5 rounded">user_role</code></li>
              <li>Após adicionar o cargo, atualize o arquivo <code className="bg-muted px-1 py-0.5 rounded">src/types/permissions.ts</code></li>
              <li>Adicione o label do cargo no objeto <code className="bg-muted px-1 py-0.5 rounded">ROLE_LABELS</code></li>
            </ol>
            <div className="mt-3 p-3 bg-muted rounded-md">
              <p className="text-xs font-mono">
                -- Exemplo de SQL para adicionar novo cargo:<br />
                ALTER TYPE public.user_role ADD VALUE 'novo_cargo';
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
