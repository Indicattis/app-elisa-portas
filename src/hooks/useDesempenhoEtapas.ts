import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DesempenhoColaborador {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
  perfiladas_metros: number;
  soldadas: number;
  soldadas_p: number;
  soldadas_g: number;
  separadas: number;
  pintura_m2: number;
  carregamentos: number;
}

export function useDesempenhoEtapas(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ["desempenho-etapas", dataInicio, dataFim],
    queryFn: async (): Promise<DesempenhoColaborador[]> => {
      // Buscar pontuações no período
      const { data: pontuacoes, error } = await supabase
        .from("pontuacao_colaboradores")
        .select("user_id, tipo_ranking, metragem_linear, porta_soldada, pedido_separado, metragem_quadrada_pintada")
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`);

      if (error) {
        console.error("Erro ao buscar desempenho por etapa:", error);
        return [];
      }

      if (!pontuacoes || pontuacoes.length === 0) return [];

      // Agrupar por user_id
      const map = new Map<string, DesempenhoColaborador>();

      for (const row of pontuacoes) {
        let entry = map.get(row.user_id);
        if (!entry) {
          entry = {
            user_id: row.user_id,
            nome: "",
            foto_perfil_url: null,
            perfiladas_metros: 0,
            soldadas: 0,
            soldadas_p: 0,
            soldadas_g: 0,
            separadas: 0,
            pintura_m2: 0,
            carregamentos: 0,
          };
          map.set(row.user_id, entry);
        }

        switch (row.tipo_ranking) {
          case "perfiladeira":
            entry.perfiladas_metros += Number(row.metragem_linear) || 0;
            break;
          case "solda":
            entry.soldadas += 1;
            if (row.porta_soldada === "P") entry.soldadas_p += 1;
            if (row.porta_soldada === "G" || row.porta_soldada === "GG") entry.soldadas_g += 1;
            break;
          case "separacao":
            entry.separadas += Number(row.pedido_separado) || 0;
            break;
          case "pintura":
            entry.pintura_m2 += Number(row.metragem_quadrada_pintada) || 0;
            break;
        }
      }

      // Buscar carregamentos concluídos nas 3 tabelas
      const [ordensRes, instRes, corrRes] = await Promise.all([
        supabase
          .from("ordens_carregamento")
          .select("carregamento_concluido_por")
          .eq("carregamento_concluido", true)
          .gte("carregamento_concluido_em", `${dataInicio}T00:00:00`)
          .lte("carregamento_concluido_em", `${dataFim}T23:59:59`),
        supabase
          .from("instalacoes")
          .select("carregamento_concluido_por")
          .eq("carregamento_concluido", true)
          .gte("carregamento_concluido_em", `${dataInicio}T00:00:00`)
          .lte("carregamento_concluido_em", `${dataFim}T23:59:59`),
        supabase
          .from("correcoes")
          .select("carregamento_concluido_por")
          .eq("carregamento_concluido", true)
          .gte("carregamento_concluido_em", `${dataInicio}T00:00:00`)
          .lte("carregamento_concluido_em", `${dataFim}T23:59:59`),
      ]);

      const allCarregamentos = [
        ...(ordensRes.data || []),
        ...(instRes.data || []),
        ...(corrRes.data || []),
      ];

      for (const row of allCarregamentos) {
        const userId = row.carregamento_concluido_por;
        if (!userId) continue;
        let entry = map.get(userId);
        if (!entry) {
          entry = {
            user_id: userId,
            nome: "",
            foto_perfil_url: null,
            perfiladas_metros: 0,
            soldadas: 0,
            soldadas_p: 0,
            soldadas_g: 0,
            separadas: 0,
            pintura_m2: 0,
            carregamentos: 0,
          };
          map.set(userId, entry);
        }
        entry.carregamentos += 1;
      }

      // Buscar nomes e fotos dos colaboradores
      const userIds = Array.from(map.keys());
      const { data: usuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url")
        .in("user_id", userIds);

      if (usuarios) {
        for (const u of usuarios) {
          const entry = map.get(u.user_id);
          if (entry) {
            entry.nome = u.nome;
            entry.foto_perfil_url = u.foto_perfil_url;
          }
        }
      }

      return Array.from(map.values());
    },
    refetchInterval: 30000,
  });
}
