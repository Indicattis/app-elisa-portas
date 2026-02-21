import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { NeoCorrecao } from "@/types/neoCorrecao";

export const useNeoCorrecoesMinhaEquipe = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week',
  verTodas: boolean = false,
  equipeIdFiltro?: string | null,
  autorizadoIdFiltro?: string | null
) => {
  const { user } = useAuth();

  // Buscar a equipe do usuário (só quando NÃO verTodas)
  const { data: equipeData, isLoading: isLoadingEquipe } = useQuery({
    queryKey: ["minha_equipe_neo_correcao", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: membroData } = await supabase
        .from("equipes_instalacao_membros")
        .select("equipe_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membroData?.equipe_id) {
        const { data: equipeResponsavel } = await supabase
          .from("equipes_instalacao")
          .select("id, nome, cor")
          .eq("responsavel_id", user.id)
          .eq("ativa", true)
          .maybeSingle();

        return equipeResponsavel;
      }

      const { data: equipe } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("id", membroData.equipe_id)
        .eq("ativa", true)
        .maybeSingle();

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

  // Buscar neo correções
  const { data: neoCorrecoes = [], isLoading: isLoadingNeo } = useQuery({
    queryKey: ["neo_correcoes_minha_equipe", verTodas ? "todas" : equipeData?.id, inicio, fim, equipeIdFiltro, autorizadoIdFiltro],
    queryFn: async () => {
      if (!verTodas && !equipeData?.id) return [];

      let query = supabase
        .from("neo_correcoes")
        .select(verTodas ? "*, equipe:equipes_instalacao(id, nome, cor)" : "*")
        .eq("concluida", false)
        .neq("status", "arquivada")
        .gte("data_correcao", inicio)
        .lte("data_correcao", fim)
        .order("data_correcao", { ascending: true });

      if (autorizadoIdFiltro) {
        query = query.eq("autorizado_id", autorizadoIdFiltro);
      } else if (equipeIdFiltro) {
        query = query.eq("equipe_id", equipeIdFiltro);
      } else if (!verTodas && equipeData?.id) {
        query = query.eq("equipe_id", equipeData.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar neo correções:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        ...item,
        _tipo: 'neo_correcao' as const,
        tipo_responsavel: (item.tipo_responsavel as 'equipe_interna' | 'autorizado' | null) || 'equipe_interna',
        equipe: verTodas ? item.equipe : equipeData
      })) as NeoCorrecao[];
    },
    enabled: verTodas || !!equipeData?.id,
  });

  return {
    neoCorrecoes,
    isLoading: verTodas ? isLoadingNeo : (isLoadingEquipe || isLoadingNeo),
  };
};
