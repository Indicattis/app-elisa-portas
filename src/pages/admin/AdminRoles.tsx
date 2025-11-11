import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Eye, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateRoleModal } from "@/components/admin/CreateRoleModal";
import { SETOR_LABELS } from "@/utils/setorMapping";

interface SystemRole {
  id: string;
  key: string;
  label: string;
  setor: string | null;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
}

interface RoleStats {
  role: string;
  count: number;
}

interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  foto_perfil_url: string | null;
  role: UserRole;
  setor: string | null;
}

export default function AdminRoles() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Buscar cargos do sistema
  const { data: systemRoles = [] } = useQuery({
    queryKey: ['system-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_roles')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as SystemRole[];
    },
  });

  // Buscar estatísticas de roles
  const { data: roleStats = [] } = useQuery({
    queryKey: ['role-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('ativo', true);

      if (error) throw error;

      // Contar usuários por role
      const stats: Record<string, number> = {};
      data.forEach(user => {
        if (user.role) {
          stats[user.role] = (stats[user.role] || 0) + 1;
        }
      });

      return Object.entries(stats).map(([role, count]) => ({
        role,
        count,
      })) as RoleStats[];
    },
  });

  // Buscar usuários de uma role específica
  const { data: usersWithRole = [] } = useQuery({
    queryKey: ['users-with-role', selectedRole],
    queryFn: async () => {
      if (!selectedRole) return [];

      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, email, foto_perfil_url, role, setor')
        .eq('role', selectedRole as UserRole)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as UserWithRole[];
    },
    enabled: !!selectedRole,
  });

  const getRoleCount = (roleKey: string) => {
    return roleStats.find(s => s.role === roleKey)?.count || 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Cargos</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e gerencie os cargos do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cargos do Sistema</CardTitle>
              <CardDescription>
                Lista completa de cargos e número de usuários ativos em cada um
              </CardDescription>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cargo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Usuários Ativos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemRoles.map((role) => {
                const count = getRoleCount(role.key);

                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.label}
                        {!role.ativo && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {role.key}
                      </code>
                    </TableCell>
                    <TableCell>
                      {role.setor ? (
                        <Badge variant="outline" className="capitalize">
                          {SETOR_LABELS[role.setor as keyof typeof SETOR_LABELS] || role.setor}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRole(role.key)}
                        disabled={count === 0}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver usuários
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para mostrar usuários de uma role */}
      <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Usuários com o cargo: {selectedRole && systemRoles.find(r => r.key === selectedRole)?.label}
            </DialogTitle>
            <DialogDescription>
              Lista de usuários ativos com este cargo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {usersWithRole.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário ativo com este cargo
              </p>
            ) : (
              <div className="space-y-2">
                {usersWithRole.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={user.foto_perfil_url || undefined} />
                      <AvatarFallback>
                        {user.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.nome}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {user.setor && (
                      <Badge variant="secondary" className="capitalize">
                        {user.setor}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de criação de cargo */}
      <CreateRoleModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
