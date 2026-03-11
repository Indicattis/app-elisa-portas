import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Loader2, Plus, UserPlus } from "lucide-react";

import { MinimalistLayout } from "@/components/MinimalistLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useVagas, type Vaga } from "@/hooks/useVagas";
import { SETOR_LABELS, SETOR_ROLES } from "@/utils/setorMapping";
import { ROLE_LABELS } from "@/types/permissions";
import { PreencherVagaDialog } from "@/components/vagas/PreencherVagaDialog";

const SETOR_KEYS = Object.keys(SETOR_LABELS);

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function VagasPage() {
  const [selectedSetor, setSelectedSetor] = useState(SETOR_KEYS[0]);
  const { data: allUsers, isLoading } = useAllUsers();
  const { vagas, updateVagaStatus } = useVagas();
  const queryClient = useQueryClient();

  // Dialog Preencher Vaga
  const [preencherVagaId, setPreencherVagaId] = useState<string | null>(null);
  const [preencherVagaCargo, setPreencherVagaCargo] = useState("");

  const { data: systemRoles } = useQuery({
    queryKey: ["system-roles-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_roles")
        .select("id, key, label, setor, descricao, ativo, ordem")
        .eq("ativo", true)
        .order("label");
      return data || [];
    },
  });

  const activeRoleKeys = (systemRoles || []).map(r => r.key);
  const rolesForSetor = (SETOR_ROLES[selectedSetor] || []).filter(
    role => activeRoleKeys.includes(role)
  );
  const filteredUsers = (allUsers || []).filter(u => rolesForSetor.includes(u.role as any));

  const getSetorCounts = (setor: string) => {
    const roles = (SETOR_ROLES[setor] || []).filter(r => activeRoleKeys.includes(r));
    const users = (allUsers || []).filter(u => roles.includes(u.role as any));
    const vagasAbertas = (vagas || []).filter(v =>
      roles.includes(v.cargo as any) && (v.status === "aberta" || v.status === "em_analise")
    );
    return { current: users.length, total: users.length + vagasAbertas.length };
  };

  const openVagasForRole = (role: string): Vaga[] =>
    (vagas || []).filter(v => v.cargo === role && (v.status === "aberta" || v.status === "em_analise"));

  const grouped = rolesForSetor.map(role => ({
    role,
    label: ROLE_LABELS[role] || role,
    users: filteredUsers.filter(u => u.role === role),
    openVagas: openVagasForRole(role).length,
    openVagasList: openVagasForRole(role),
  }));

  const handlePreencherClick = (vaga: Vaga) => {
    setPreencherVagaId(vaga.id);
    setPreencherVagaCargo(vaga.cargo);
  };

  const handlePreencherSuccess = async () => {
    if (preencherVagaId) {
      await updateVagaStatus(preencherVagaId, "preenchida");
    }
    setPreencherVagaId(null);
    setPreencherVagaCargo("");
    queryClient.invalidateQueries({ queryKey: ["all-users"] });
  };

  return (
    <MinimalistLayout
      title="Vagas"
      subtitle="Quadro de vagas por setor"
      backPath="/administrativo/rh-dp"
      fullWidth
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "RH/DP", path: "/administrativo/rh-dp" },
        { label: "Vagas" },
      ]}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Mobile: horizontal chips */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {SETOR_KEYS.map(setor => {
            const counts = getSetorCounts(setor);
            const isFull = counts.total > 0 && counts.current === counts.total;
            return (
              <button
                key={setor}
                onClick={() => setSelectedSetor(setor)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                  ${selectedSetor === setor
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                  }`}
              >
                {SETOR_LABELS[setor]}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isFull ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {counts.current}/{counts.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop: sidebar */}
        <div className="hidden md:flex flex-col w-56 shrink-0">
          <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex flex-col gap-1 p-2">
              {SETOR_KEYS.map(setor => {
                const counts = getSetorCounts(setor);
                const isFull = counts.total > 0 && counts.current === counts.total;
                return (
                  <button
                    key={setor}
                    onClick={() => setSelectedSetor(setor)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${selectedSetor === setor
                        ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {SETOR_LABELS[setor]}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isFull ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {counts.current}/{counts.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <Users className="w-10 h-10 mb-3" />
              <p className="text-sm">Nenhum colaborador neste setor</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(group => {
                const total = group.users.length + group.openVagas;
                const isFull = group.openVagas === 0 && group.users.length > 0;
                const isEmpty = group.users.length === 0 && group.openVagas === 0;
                return (
                  <div key={group.role}>
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-sm font-semibold text-white/80">{group.label}</h2>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isEmpty
                            ? "border-white/10 text-white/30 bg-white/5"
                            : isFull
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {group.users.length}/{total || 0}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.users.map(user => (
                        <div
                          key={user.id}
                          className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <Avatar className="h-10 w-10 border border-white/10">
                              {user.foto_perfil_url ? (
                                <AvatarImage src={user.foto_perfil_url} alt={user.nome} />
                              ) : null}
                              <AvatarFallback className="bg-blue-600/20 text-blue-300 text-xs font-medium">
                                {getInitials(user.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate">{user.nome}</p>
                              <p className="text-xs text-white/40 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Open vacancy cards — clickable to fill */}
                      {group.openVagasList.map(vaga => (
                        <button
                          key={vaga.id}
                          onClick={() => handlePreencherClick(vaga)}
                          className="p-1.5 rounded-xl border border-dashed border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all duration-200 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className="h-10 w-10 rounded-full border border-dashed border-amber-500/30 flex items-center justify-center">
                              <UserPlus className="w-4 h-4 text-amber-500/50" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-amber-400/70">Vaga aberta</p>
                              <p className="text-[10px] text-amber-400/40">Clique para preencher</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Preencher Vaga */}
      <PreencherVagaDialog
        open={!!preencherVagaId}
        onOpenChange={(open) => {
          if (!open) {
            setPreencherVagaId(null);
            setPreencherVagaCargo("");
          }
        }}
        defaultRole={preencherVagaCargo}
        onSuccess={handlePreencherSuccess}
      />
    </MinimalistLayout>
  );
}
