import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { NeoInstalacao } from "@/types/neoInstalacao";

export const useNeoInstalacoesMinhaEquipe = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week',
  verTodas: boolean = false,
  equipeIdFiltro?: string | null,
  autorizadoIdFiltro?: string | null
) => {
  const { user } = useAuth();

  // Buscar a equipe do usuário (só quando NÃO verTodas)
  const { data: equipeData, isLoading: isLoadingEquipe } = useQuery({
    queryKey: ["minha_equipe_neo_instalacao", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: membroData, error: membroError } = await supabase
        .from("equipes_instalacao_membros")
        .select("equipe_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membroError) {
        console.error("Erro ao buscar membro da equipe:", membroError);
        return null;
      }

      if (!membroData?.equipe_id) {
        const { data: equipeResponsavel } = await supabase
          .from("equipes_instalacao")
          .select("id, nome, cor")
          .eq("responsavel_id", user.id)
          .eq("ativa", true)
          .maybeSingle();

        return equipeResponsavel;
      }

      const { data: equipe, error: equipeError } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("id", membroData.equipe_id)
        .eq("ativa", true)
        .maybeSingle();

      if (equipeError) {
        console.error("Erro ao buscar equipe:", equipeError);
        return null;
      }

      return equipe;
    },
    enabled: !!user?.id && !verTodas,
  });

  // Calcular intervalo de datas
  const getDateRange = () => {
    if (periodo === 'week') {
      return {
        inicio: format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        fim: format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      };
    } else {
      return {
        inicio: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
        fim: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
      };
    }
  };

  const { inicio, fim } = getDateRange();

  // Buscar neo instalações
  const { data: neoInstalacoes = [], isLoading: isLoadingNeo } = useQuery({
    queryKey: ["neo_instalacoes_minha_equipe", verTodas ? "todas" : equipeData?.id, inicio, fim, equipeIdFiltro, autorizadoIdFiltro],
    queryFn: async () => {
      if (!verTodas && !equipeData?.id) return [];

      let query = supabase
        .from("neo_instalacoes")
        .select(verTodas ? "*, equipe:equipes_instalacao(id, nome, cor)" : "*")
        .eq("concluida", false)
        .neq("status", "arquivada")
        .gte("data_instalacao", inicio)
        .lte("data_instalacao", fim)
        .order("data_instalacao", { ascending: true });

      if (autorizadoIdFiltro) {
        query = query.eq("autorizado_id", autorizadoIdFiltro);
      } else if (equipeIdFiltro) {
        query = query.eq("equipe_id", equipeIdFiltro);
      } else if (!verTodas && equipeData?.id) {
        query = query.eq("equipe_id", equipeData.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar neo instalações:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        ...item,
        _tipo: 'neo_instalacao' as const,
        equipe: verTodas ? item.equipe : equipeData
      })) as NeoInstalacao[];
    },
    enabled: verTodas || !!equipeData?.id,
  });

  return {
    neoInstalacoes,
    isLoading: verTodas ? isLoadingNeo : (isLoadingEquipe || isLoadingNeo),
    equipeId: verTodas ? null : (equipeData?.id || null),
    equipeNome: verTodas ? "Todas as equipes" : (equipeData?.nome || null),
    equipeCor: verTodas ? null : (equipeData?.cor || null),
    temEquipe: verTodas ? true : !!equipeData?.id,
  };
};
