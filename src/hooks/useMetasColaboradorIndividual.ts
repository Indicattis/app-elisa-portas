import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DesempenhoDiario {
  data: string;
  dia_semana: string;
  solda_qtd: number;
  perfiladeira_metros: number;
  separacao_qtd: number;
  qualidade_qtd: number;
  pintura_m2: number;
  carregamento_qtd: number;
}

export interface MetaColaborador {
  id: string;
  user_id: string;
  tipo_meta: 'solda' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura' | 'carregamento';
  valor_meta: number;
  data_inicio: string;
  data_termino: string;
  recompensa_valor: number;
  concluida: boolean;
  concluida_em: string | null;
  created_at: string;
  desbloqueada: boolean;
}

export interface ColaboradorInfo {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
}

export function useColaboradorInfo(userId: string) {
  return useQuery({
    queryKey: ["colaborador-info", userId],
    queryFn: async (): Promise<ColaboradorInfo | null> => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar colaborador:", error);
        return null;
      }

      return data;
    },
    enabled: !!userId,
  });
}

export function useDesempenhoDiarioColaborador(
  userId: string,
  dataInicio: Date,
  dataFim: Date
) {
  return useQuery({
    queryKey: ["desempenho-diario", userId, dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async (): Promise<DesempenhoDiario[]> => {
      const { data, error } = await supabase.rpc("get_desempenho_diario_colaborador", {
        p_user_id: userId,
        p_data_inicio: dataInicio.toISOString().split("T")[0],
        p_data_fim: dataFim.toISOString().split("T")[0],
      });

      if (error) {
        console.error("Erro ao buscar desempenho diário:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        data: item.data,
        dia_semana: item.dia_semana,
        solda_qtd: Number(item.solda_qtd) || 0,
        perfiladeira_metros: Number(item.perfiladeira_metros) || 0,
        separacao_qtd: Number(item.separacao_qtd) || 0,
        qualidade_qtd: Number(item.qualidade_qtd) || 0,
        pintura_m2: Number(item.pintura_m2) || 0,
        carregamento_qtd: Number(item.carregamento_qtd) || 0,
      }));
    },
    enabled: !!userId,
  });
}

export function useMetasColaborador(userId: string) {
  return useQuery({
    queryKey: ["metas-colaborador", userId],
    queryFn: async (): Promise<MetaColaborador[]> => {
      const { data, error } = await supabase
        .from("metas_colaboradores")
        .select("*")
        .eq("user_id", userId)
        .order("data_termino", { ascending: true });

      if (error) {
        console.error("Erro ao buscar metas:", error);
        throw error;
      }

      return (data || []) as MetaColaborador[];
    },
    enabled: !!userId,
  });
}

export function useCriarMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meta: Omit<MetaColaborador, "id" | "concluida" | "concluida_em" | "created_at">) => {
      const { data, error } = await supabase
        .from("metas_colaboradores")
        .insert(meta)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["metas-colaborador", variables.user_id] });
    },
  });
}

export function useAtualizarMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MetaColaborador> & { id: string }) => {
      const { data, error } = await supabase
        .from("metas_colaboradores")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["metas-colaborador", data.user_id] });
    },
  });
}

export function useExcluirMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("metas_colaboradores")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, userId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["metas-colaborador", variables.userId] });
    },
  });
}

export function useDesbloquearMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ metaId, userId }: { metaId: string; userId: string }) => {
      const { error } = await supabase
        .from("metas_colaboradores")
        .update({ desbloqueada: true })
        .eq("id", metaId);

      if (error) throw error;
      return { metaId, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["metas-colaborador", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["meta-ativa-progresso"] });
    },
  });
}
