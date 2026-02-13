import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { OrdemCarregamento } from "@/types/ordemCarregamento";

export const useInstalacoesMinhaEquipeCalendario = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week',
  verTodas: boolean = false,
  equipeIdFiltro?: string | null
) => {
  const { user } = useAuth();

  // Buscar todas as equipes ativas (para mapear cores quando verTodas)
  const { data: todasEquipes } = useQuery({
    queryKey: ["todas_equipes_instalacao"],
    queryFn: async () => {
      const { data } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);
      return data || [];
    },
    enabled: verTodas,
  });

  // Buscar a equipe do usuário (só quando NÃO verTodas)
  const { data: equipeData, isLoading: isLoadingEquipe } = useQuery({
    queryKey: ["minha_equipe_instalacao_calendario", user?.id],
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

      let equipeId = membroData?.equipe_id;

      if (!equipeId) {
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

  // Buscar instalações da tabela instalacoes (fonte de verdade)
  const { data: ordens = [], isLoading: isLoadingOrdens } = useQuery({
    queryKey: ["instalacoes_minha_equipe_calendario", verTodas ? "todas" : equipeData?.id, inicio, fim, equipeIdFiltro],
    queryFn: async () => {
      if (!verTodas && !equipeData?.id) return [];

      let query = supabase
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
        .eq("carregamento_concluido", false)
        .not("data_carregamento", "is", null)
        .gte("data_carregamento", inicio)
        .lte("data_carregamento", fim)
        .order("data_carregamento", { ascending: true });

      if (equipeIdFiltro) {
        query = query.eq("responsavel_carregamento_id", equipeIdFiltro);
      } else if (!verTodas && equipeData?.id) {
        query = query.eq("responsavel_carregamento_id", equipeData.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar instalações:", error);
        throw error;
      }

      // Mapear cores das equipes
      const equipesMap = new Map<string, string>();
      if (verTodas && todasEquipes) {
        todasEquipes.forEach(e => {
          if (e.cor) equipesMap.set(e.id, e.cor);
        });
      }

      // Mapear campos da tabela instalacoes para OrdemCarregamento
      return (data || []).map(item => ({
        id: item.id,
        pedido_id: item.pedido_id,
        venda_id: item.venda_id,
        nome_cliente: item.nome_cliente,
        tipo_carregamento: item.tipo_carregamento,
        data_carregamento: item.data_carregamento,
        hora: item.hora,
        hora_carregamento: item.hora_carregamento,
        responsavel_carregamento_id: item.responsavel_carregamento_id,
        responsavel_carregamento_nome: item.responsavel_carregamento_nome,
        status: item.status,
        carregamento_concluido: item.carregamento_concluido,
        carregamento_concluido_em: item.carregamento_concluido_em,
        carregamento_concluido_por: item.carregamento_concluido_por,
        latitude: null,
        longitude: null,
        geocode_precision: null,
        last_geocoded_at: null,
        observacoes: item.observacoes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        fonte: 'instalacoes' as const,
        venda: item.venda,
        _corEquipe: verTodas
          ? equipesMap.get(item.responsavel_carregamento_id) || undefined
          : equipeData?.cor
      })) as unknown as OrdemCarregamento[];
    },
    enabled: verTodas || !!equipeData?.id,
  });

  return {
    ordens: ordens as OrdemCarregamento[],
    isLoading: verTodas ? isLoadingOrdens : (isLoadingEquipe || isLoadingOrdens),
    equipeId: verTodas ? null : (equipeData?.id || null),
    equipeNome: verTodas ? "Todas as equipes" : (equipeData?.nome || null),
    equipeCor: verTodas ? null : (equipeData?.cor || null),
    temEquipe: verTodas ? true : !!equipeData?.id,
  };
};
