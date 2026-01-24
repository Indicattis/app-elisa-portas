import { useNavigate } from "react-router-dom";
import { Flame, Ruler, Package, CheckCircle, Paintbrush, Truck, User, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMetasColaboradores } from "@/hooks/useMetasColaboradores";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MinimalistLayout } from "@/components/MinimalistLayout";

export default function MetasFabricaDirecao() {
  const navigate = useNavigate();
  const { data: colaboradores, isLoading } = useMetasColaboradores();

  // Buscar user_ids que têm metas individuais ativas
  const { data: usersComMetas } = useQuery({
    queryKey: ["users-com-metas-individuais-fabrica"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("metas_colaboradores")
        .select("user_id")
        .gte("data_termino", hoje)
        .eq("concluida", false);

      if (error) {
        console.error("Erro ao buscar metas individuais:", error);
        return new Set<string>();
      }

      return new Set(data?.map((m) => m.user_id) || []);
    },
  });

  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const getInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const formatNumber = (value: number, decimals = 0) => {
    return value.toFixed(decimals).replace(".", ",");
  };

  return (
    <MinimalistLayout 
      title="Metas da Fábrica" 
      subtitle="Desempenho dos colaboradores"
      backPath="/direcao/metas"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Metas", path: "/direcao/metas" },
        { label: "Fábrica" }
      ]}
    >
      {/* Period Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold capitalize text-white">{mesAtual}</h2>
        <p className="text-sm text-white/60">
          Desempenho dos colaboradores da fábrica
        </p>
      </div>

      {/* Column Headers */}
      <div className="hidden md:grid md:grid-cols-[1fr,60px,repeat(6,80px)] gap-2 px-4 py-2 mb-2 text-xs font-medium text-white/60">
        <div>Colaborador</div>
        <div className="text-center flex flex-col items-center gap-1">
          <Trophy className="h-4 w-4" />
          <span>Metas</span>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <Flame className="h-4 w-4" />
          <span>Solda</span>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <Ruler className="h-4 w-4" />
          <span>Perfil (m)</span>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <Package className="h-4 w-4" />
          <span>Separação</span>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          <span>Qualidade</span>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <Paintbrush className="h-4 w-4" />
          <span>Pintura (m²)</span>
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <Truck className="h-4 w-4" />
          <span>Expedição</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!colaboradores || colaboradores.length === 0) && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">
            Nenhum colaborador encontrado
          </p>
        </div>
      )}

      {/* Collaborator List */}
      <div className="space-y-2">
        {colaboradores?.map((colaborador) => (
          <div
            key={colaborador.user_id}
            className="bg-primary/5 border border-primary/10 rounded-lg p-4 hover:bg-primary/10 transition-colors cursor-pointer"
            onClick={() => navigate(`/direcao/metas/${colaborador.user_id}`)}
          >
            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                  <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm">
                    {getInitials(colaborador.nome)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-white">{colaborador.nome}</span>
                {usersComMetas?.has(colaborador.user_id) && (
                  <Trophy className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {colaborador.solda_qtd > 0 && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{colaborador.solda_qtd}</span>
                  </div>
                )}
                {colaborador.perfiladeira_metros > 0 && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Ruler className="h-3.5 w-3.5" />
                    <span>{formatNumber(colaborador.perfiladeira_metros, 1)}m</span>
                  </div>
                )}
                {colaborador.separacao_qtd > 0 && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Package className="h-3.5 w-3.5" />
                    <span>{colaborador.separacao_qtd}</span>
                  </div>
                )}
                {colaborador.qualidade_qtd > 0 && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{colaborador.qualidade_qtd}</span>
                  </div>
                )}
                {colaborador.pintura_m2 > 0 && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Paintbrush className="h-3.5 w-3.5" />
                    <span>{formatNumber(colaborador.pintura_m2, 1)}m²</span>
                  </div>
                )}
                {colaborador.carregamento_qtd > 0 && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Truck className="h-3.5 w-3.5" />
                    <span>{colaborador.carregamento_qtd}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-[1fr,60px,repeat(6,80px)] gap-2 items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                  <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm">
                    {getInitials(colaborador.nome)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-white">{colaborador.nome}</span>
              </div>
              <div className="text-center">
                {usersComMetas?.has(colaborador.user_id) ? (
                  <Trophy className="h-5 w-5 text-amber-500 mx-auto" />
                ) : (
                  <span className="text-xs text-white/30">—</span>
                )}
              </div>
              <div className="text-center font-medium text-white">
                {colaborador.solda_qtd > 0 ? colaborador.solda_qtd : ''}
              </div>
              <div className="text-center font-medium text-white">
                {colaborador.perfiladeira_metros > 0 ? `${formatNumber(colaborador.perfiladeira_metros, 1)}m` : ''}
              </div>
              <div className="text-center font-medium text-white">
                {colaborador.separacao_qtd > 0 ? colaborador.separacao_qtd : ''}
              </div>
              <div className="text-center font-medium text-white">
                {colaborador.qualidade_qtd > 0 ? colaborador.qualidade_qtd : ''}
              </div>
              <div className="text-center font-medium text-white">
                {colaborador.pintura_m2 > 0 ? formatNumber(colaborador.pintura_m2, 1) : ''}
              </div>
              <div className="text-center font-medium text-white">
                {colaborador.carregamento_qtd > 0 ? colaborador.carregamento_qtd : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </MinimalistLayout>
  );
}
