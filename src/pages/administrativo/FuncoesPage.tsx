import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Eye, Plus, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateRoleModal } from "@/components/admin/CreateRoleModal";
import { EditRoleModal } from "@/components/admin/EditRoleModal";
import { SETOR_LABELS } from "@/utils/setorMapping";
import { UserRole } from "@/types/permissions";

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

export default function FuncoesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);

  const { data: systemRoles = [] } = useQuery({
    queryKey: ["system-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_roles")
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as SystemRole[];
    },
  });

  const { data: roleStats = [] } = useQuery({
    queryKey: ["role-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("role")
        .eq("ativo", true);
      if (error) throw error;
      const stats: Record<string, number> = {};
      data.forEach((user) => {
        if (user.role) stats[user.role] = (stats[user.role] || 0) + 1;
      });
      return Object.entries(stats).map(([role, count]) => ({ role, count })) as RoleStats[];
    },
  });

  const { data: usersWithRole = [] } = useQuery({
    queryKey: ["users-with-role", selectedRole],
    queryFn: async () => {
      if (!selectedRole) return [];
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, nome, email, foto_perfil_url, role, setor")
        .eq("role", selectedRole as UserRole)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as UserWithRole[];
    },
    enabled: !!selectedRole,
  });

  const getRoleCount = (roleKey: string) =>
    roleStats.find((s) => s.role === roleKey)?.count || 0;

  return (
    <MinimalistLayout
      title="Funções"
      subtitle="Gerenciar funções dos colaboradores"
      backPath="/administrativo/rh-dp"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "RH/DP", path: "/administrativo/rh-dp" },
        { label: "Funções" },
      ]}
      headerActions={
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/10 backdrop-blur-xl rounded-lg overflow-hidden">
          <div className="p-4 border-b border-primary/10">
            <h3 className="text-lg font-semibold text-white">Funções do Sistema</h3>
            <p className="text-sm text-white/60">
              Lista completa de funções e número de colaboradores ativos
            </p>
          </div>

          <div className="divide-y divide-primary/10">
            {systemRoles.map((role) => {
              const count = getRoleCount(role.key);
              return (
                <div
                  key={role.id}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{role.label}</span>
                      {!role.ativo && (
                        <Badge variant="secondary" className="text-xs bg-white/10 text-white/60">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
                        {role.key}
                      </code>
                      {role.setor && (
                        <Badge variant="outline" className="capitalize text-white/60 border-white/20">
                          {SETOR_LABELS[role.setor as keyof typeof SETOR_LABELS] || role.setor}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white/60">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold text-white">{count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRole(role)}
                        disabled={count > 0}
                        className="text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                        title={count > 0 ? "Não é possível editar funções com colaboradores associados" : "Editar função"}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRole(role.key)}
                        disabled={count === 0}
                        className="text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black/90 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Colaboradores com a função: {selectedRole && systemRoles.find((r) => r.key === selectedRole)?.label}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Lista de colaboradores ativos com esta função
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {usersWithRole.length === 0 ? (
              <p className="text-center text-white/60 py-8">
                Nenhum colaborador ativo com esta função
              </p>
            ) : (
              <div className="space-y-2">
                {usersWithRole.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={user.foto_perfil_url || undefined} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-white">{user.nome}</p>
                      <p className="text-sm truncate text-white/60">{user.email}</p>
                    </div>
                    {user.setor && (
                      <Badge variant="secondary" className="capitalize bg-white/10 text-white/60">
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

      <CreateRoleModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <EditRoleModal
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
        role={editingRole}
      />
    </MinimalistLayout>
  );
}
