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

interface PontuacaoRow {
  user_id: string;
  tipo_ranking: string | null;
  metragem_linear: number | null;
  porta_soldada: string | null;
  pedido_separado: number | null;
  metragem_quadrada_pintada: number | null;
  user: { nome: string; foto_perfil_url: string | null } | null;
}

export function useDesempenhoEtapas(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ["desempenho-etapas", dataInicio, dataFim],
    queryFn: async (): Promise<DesempenhoColaborador[]> => {
      const { data, error } = await supabase
        .from("pontuacao_colaboradores")
        .select("user_id, tipo_ranking, metragem_linear, porta_soldada, pedido_separado, metragem_quadrada_pintada, user:admin_users!user_id(nome, foto_perfil_url)")
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`);

      if (error) {
        console.error("Erro ao buscar desempenho por etapa:", error);
        return [];
      }

      if (!data || data.length === 0) return [];

      const rows = data as unknown as PontuacaoRow[];

      // Agrupar por user_id
      const map = new Map<string, DesempenhoColaborador>();

      for (const row of rows) {
        let entry = map.get(row.user_id);
        if (!entry) {
          const user = row.user;
          entry = {
            user_id: row.user_id,
            nome: user?.nome || "",
            foto_perfil_url: user?.foto_perfil_url || null,
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

      return Array.from(map.values());
    },
    refetchInterval: 30000,
  });
}
