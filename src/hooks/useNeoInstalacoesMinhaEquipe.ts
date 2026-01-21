import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { NeoInstalacao } from "@/types/neoInstalacao";

export const useNeoInstalacoesMinhaEquipe = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week'
) => {
  const { user } = useAuth();

  // Buscar a equipe do usuário
  const { data: equipeData, isLoading: isLoadingEquipe } = useQuery({
    queryKey: ["minha_equipe_neo_instalacao", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Buscar a equipe do usuário via tabela de membros
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
        // Verificar se é responsável de alguma equipe
        const { data: equipeResponsavel } = await supabase
          .from("equipes_instalacao")
          .select("id, nome, cor")
          .eq("responsavel_id", user.id)
          .eq("ativa", true)
          .maybeSingle();

        return equipeResponsavel;
      }

      // Buscar detalhes da equipe
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
    enabled: !!user?.id,
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

  // Buscar neo instalações da equipe
  const { data: neoInstalacoes = [], isLoading: isLoadingNeo } = useQuery({
    queryKey: ["neo_instalacoes_minha_equipe", equipeData?.id, inicio, fim],
    queryFn: async () => {
      if (!equipeData?.id) return [];

      const { data, error } = await supabase
        .from("neo_instalacoes")
        .select("*")
        .eq("equipe_id", equipeData.id)
        .eq("concluida", false)
        .gte("data_instalacao", inicio)
        .lte("data_instalacao", fim)
        .order("data_instalacao", { ascending: true });

      if (error) {
        console.error("Erro ao buscar neo instalações:", error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        _tipo: 'neo_instalacao' as const,
        equipe: equipeData
      })) as NeoInstalacao[];
    },
    enabled: !!equipeData?.id,
  });

  return {
    neoInstalacoes,
    isLoading: isLoadingEquipe || isLoadingNeo,
    equipeId: equipeData?.id || null,
    equipeNome: equipeData?.nome || null,
    equipeCor: equipeData?.cor || null,
    temEquipe: !!equipeData?.id,
  };
};
