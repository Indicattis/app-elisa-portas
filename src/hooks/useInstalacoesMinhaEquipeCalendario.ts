import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { InstalacaoCalendario } from "./useOrdensInstalacaoCalendario";

export const useInstalacoesMinhaEquipeCalendario = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week'
) => {
  const { user } = useAuth();

  // Buscar a equipe do usuário
  const { data: equipeData, isLoading: isLoadingEquipe } = useQuery({
    queryKey: ["minha_equipe_instalacao_calendario", user?.id],
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

      let equipeId = membroData?.equipe_id;

      if (!equipeId) {
        // Verificar se é responsável de alguma equipe
        const { data: equipeResponsavel } = await supabase
          .from("equipes_instalacao")
          .select("id, nome, cor")
          .eq("responsavel_id", user.id)
          .eq("ativa", true)
          .maybeSingle();

        if (equipeResponsavel) {
          return equipeResponsavel;
        }
        return null;
      }

      // Buscar detalhes da equipe
      const { data: equipe, error: equipeError } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("id", equipeId)
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

  // Buscar instalações da equipe diretamente da tabela instalacoes
  const { data: instalacoes = [], isLoading: isLoadingInstalacoes } = useQuery({
    queryKey: ["instalacoes_minha_equipe_calendario", equipeData?.id, inicio, fim],
    queryFn: async () => {
      if (!equipeData?.id) return [];

      const { data, error } = await supabase
        .from("instalacoes")
        .select(`
          *,
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro
          )
        `)
        .eq("responsavel_instalacao_id", equipeData.id)
        .eq("instalacao_concluida", false)
        .not("data_instalacao", "is", null)
        .gte("data_instalacao", inicio)
        .lte("data_instalacao", fim)
        .order("data_instalacao", { ascending: true });

      if (error) {
        console.error("Erro ao buscar instalações da equipe:", error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        equipe: equipeData,
        _corEquipe: equipeData.cor
      })) as InstalacaoCalendario[];
    },
    enabled: !!equipeData?.id,
  });

  return {
    instalacoes,
    isLoading: isLoadingEquipe || isLoadingInstalacoes,
    equipeId: equipeData?.id || null,
    equipeNome: equipeData?.nome || null,
    equipeCor: equipeData?.cor || null,
    temEquipe: !!equipeData?.id,
  };
};
