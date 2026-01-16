import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetricasColaborador {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
  solda_qtd: number;
  perfiladeira_metros: number;
  separacao_qtd: number;
  qualidade_qtd: number;
  pintura_m2: number;
  carregamento_qtd: number;
}

export function useMetasColaboradores() {
  return useQuery({
    queryKey: ["metas-colaboradores"],
    queryFn: async (): Promise<MetricasColaborador[]> => {
      const { data, error } = await supabase.rpc("get_metas_colaboradores_mes");

      if (error) {
        console.error("Erro ao buscar metas:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        nome: item.nome,
        foto_perfil_url: item.foto_perfil_url,
        solda_qtd: Number(item.solda_qtd) || 0,
        perfiladeira_metros: Number(item.perfiladeira_metros) || 0,
        separacao_qtd: Number(item.separacao_qtd) || 0,
        qualidade_qtd: Number(item.qualidade_qtd) || 0,
        pintura_m2: Number(item.pintura_m2) || 0,
        carregamento_qtd: Number(item.carregamento_qtd) || 0,
      }));
    },
  });
}
