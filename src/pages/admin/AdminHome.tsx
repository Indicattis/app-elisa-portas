import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Building2, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS } from "@/types/permissions";
import { getSetorFromRole } from "@/utils/setorMapping";

export default function AdminHome() {
  // Buscar quantidade de colaboradores por cargo
  const { data: roleStats } = useQuery({
    queryKey: ["admin-role-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("role")
        .eq("ativo", true);

      if (error) throw error;

      // Agrupar por role e contar
      const stats = (data || []).reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Converter para array e ordenar por quantidade (decrescente)
      return Object.entries(stats)
        .map(([role, count]) => ({
          role,
          count,
          label: ROLE_LABELS[role] || role,
          setor: getSetorFromRole(role as any)
        }))
        .sort((a, b) => b.count - a.count);
    },
  });

  const totalColaboradores = roleStats?.reduce((sum, stat) => sum + stat.count, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administração</h1>
        <p className="text-muted-foreground mt-2">
          Painel de controle e configurações do sistema.
        </p>
      </div>

      {/* Indicadores de Colaboradores por Cargo */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Colaboradores por Cargo</h2>
          <span className="text-sm text-muted-foreground ml-auto">
            Total: {totalColaboradores} colaboradores ativos
          </span>
        </div>
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roleStats?.map((stat) => (
            <Card key={stat.role}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                {stat.setor && (
                  <CardDescription className="text-xs">
                    Setor: {stat.setor.charAt(0).toUpperCase() + stat.setor.slice(1)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.count === 1 ? 'colaborador' : 'colaboradores'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/permissions">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Permissões</CardTitle>
              </div>
              <CardDescription>
                Gerenciar permissões de acesso por usuário e rota
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Controle de acesso simplificado ao sistema
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Usuários</CardTitle>
              </div>
              <CardDescription>
                Gerenciar usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Adicionar, editar e desativar usuários
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/company">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Empresa</CardTitle>
              </div>
              <CardDescription>
                Configurações da empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerenciar informações da empresa nos contratos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
