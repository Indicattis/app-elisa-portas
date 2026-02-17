import { useNavigate } from "react-router-dom";
import { User, Trophy, Users, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MinimalistLayout } from "@/components/MinimalistLayout";

const roleLabels: Record<string, string> = {
  gerente_instalacoes: "Gerente",
  instalador: "Instalador",
  aux_instalador: "Auxiliar",
};

interface Colaborador {
  id: string;
  user_id: string;
  nome: string;
  role: string;
  foto_perfil_url: string | null;
}

interface Equipe {
  id: string;
  nome: string;
  cor: string;
  responsavel_id: string | null;
  responsavel?: { nome: string; foto_perfil_url: string | null } | null;
  membros: Colaborador[];
}

export default function MetasInstalacoesDirecao() {
  const navigate = useNavigate();

  // Buscar colaboradores do setor de instalação
  const { data: colaboradores, isLoading: loadingColabs } = useQuery({
    queryKey: ["colaboradores-instalacao-metas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, user_id, nome, role, foto_perfil_url")
        .in("role", ["gerente_instalacoes", "instalador", "aux_instalador"])
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return (data || []) as Colaborador[];
    },
  });

  // Buscar equipes ativas com membros
  const { data: equipes, isLoading: loadingEquipes } = useQuery({
    queryKey: ["equipes-instalacao-metas"],
    queryFn: async () => {
      const { data: equipesData, error } = await supabase
        .from("equipes_instalacao")
        .select(`*, responsavel:responsavel_id (nome, foto_perfil_url)`)
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;

      const result: Equipe[] = await Promise.all(
        (equipesData || []).map(async (eq: any) => {
          const { data: membrosData } = await supabase
            .from("equipes_instalacao_membros")
            .select("user_id")
            .eq("equipe_id", eq.id);

          const userIds = (membrosData || []).map((m: any) => m.user_id);

          let membros: Colaborador[] = [];
          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from("admin_users")
              .select("id, user_id, nome, role, foto_perfil_url")
              .in("user_id", userIds)
              .eq("ativo", true);
            membros = (usersData || []) as Colaborador[];
          }

          return {
            id: eq.id,
            nome: eq.nome,
            cor: eq.cor,
            responsavel_id: eq.responsavel_id,
            responsavel: eq.responsavel,
            membros,
          };
        })
      );

      return result;
    },
  });

  // Buscar user_ids com metas individuais ativas
  const { data: usersComMetas } = useQuery({
    queryKey: ["users-com-metas-individuais-instalacoes"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("metas_colaboradores")
        .select("user_id")
        .gte("data_termino", hoje)
        .eq("concluida", false);

      if (error) return new Set<string>();
      return new Set(data?.map((m) => m.user_id) || []);
    },
  });

  const isLoading = loadingColabs || loadingEquipes;
  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  // Identificar colaboradores sem equipe
  const membrosEmEquipes = new Set<string>();
  equipes?.forEach((eq) => {
    if (eq.responsavel_id) membrosEmEquipes.add(eq.responsavel_id);
    eq.membros.forEach((m) => membrosEmEquipes.add(m.user_id));
  });
  const semEquipe = colaboradores?.filter((c) => !membrosEmEquipes.has(c.user_id)) || [];

  const renderColaborador = (colab: Colaborador, isResponsavel = false) => (
    <div
      key={colab.user_id}
      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
      onClick={() => navigate(`/direcao/metas/fabrica/instalacoes/${colab.user_id}`)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={colab.foto_perfil_url || undefined} />
        <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm">
          {getInitials(colab.nome)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{colab.nome}</span>
          {usersComMetas?.has(colab.user_id) && (
            <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">{roleLabels[colab.role] || colab.role}</span>
          {isResponsavel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-400">
              <Crown className="h-3 w-3 mr-0.5" /> Responsável
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <MinimalistLayout
      title="Metas Instalações"
      subtitle="Colaboradores do setor de instalação"
      backPath="/direcao/metas"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Metas", path: "/direcao/metas" },
        { label: "Instalações" },
      ]}
    >
      {/* Period Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold capitalize text-white">{mesAtual}</h2>
        <p className="text-sm text-white/60">Equipes e colaboradores de instalação</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!colaboradores || colaboradores.length === 0) && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">Nenhum colaborador encontrado</p>
        </div>
      )}

      {!isLoading && colaboradores && colaboradores.length > 0 && (
        <div className="space-y-6">
          {/* Equipes */}
          {equipes?.map((equipe) => {
            const responsavelColab = colaboradores.find((c) => c.user_id === equipe.responsavel_id);
            const membrosExcluindoResp = equipe.membros.filter(
              (m) => m.user_id !== equipe.responsavel_id
            );

            return (
              <div
                key={equipe.id}
                className="rounded-xl border border-primary/10 overflow-hidden"
              >
                {/* Header da equipe com faixa colorida */}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderLeft: `4px solid ${equipe.cor}` }}
                >
                  <Users className="h-5 w-5 text-white/70" />
                  <h3 className="font-semibold text-white">{equipe.nome}</h3>
                  <span className="text-xs text-white/40 ml-auto">
                    {(responsavelColab ? 1 : 0) + membrosExcluindoResp.length} membro(s)
                  </span>
                </div>

                {/* Membros */}
                <div className="p-3 space-y-2 bg-primary/5">
                  {responsavelColab && renderColaborador(responsavelColab, true)}
                  {membrosExcluindoResp.map((m) => renderColaborador(m))}
                  {!responsavelColab && membrosExcluindoResp.length === 0 && (
                    <p className="text-sm text-white/40 text-center py-2">Nenhum membro</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Sem equipe */}
          {semEquipe.length > 0 && (
            <div className="rounded-xl border border-primary/10 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-l-4 border-white/20">
                <User className="h-5 w-5 text-white/70" />
                <h3 className="font-semibold text-white">Sem equipe</h3>
                <span className="text-xs text-white/40 ml-auto">{semEquipe.length} membro(s)</span>
              </div>
              <div className="p-3 space-y-2 bg-primary/5">
                {semEquipe.map((c) => renderColaborador(c))}
              </div>
            </div>
          )}
        </div>
      )}
    </MinimalistLayout>
  );
}
