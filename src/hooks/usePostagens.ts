import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Postagem {
  id: string;
  titulo: string;
  descricao: string | null;
  link_post: string | null;
  data_postagem: string;
  plataforma: string;
  curtidas: number;
  visualizacoes: number;
  comentarios: number;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  agendada: boolean;
  postada: boolean;
  hora_agendamento: string | null;
}

export interface PostagensStats {
  total_mes: number;
  total_semana: number;
  media_curtidas: number;
  media_visualizacoes: number;
}

// Hook para listar postagens de um período
export function usePostagens(ano: number, mes?: number) {
  return useQuery({
    queryKey: ["postagens", ano, mes],
    queryFn: async () => {
      let query = supabase
        .from("postagens")
        .select("*")
        .order("data_postagem", { ascending: false });

      if (mes) {
        const startDate = `${ano}-${String(mes).padStart(2, "0")}-01`;
        const endDate = `${ano}-${String(mes).padStart(2, "0")}-31`;
        query = query.gte("data_postagem", startDate).lte("data_postagem", endDate);
      } else {
        query = query
          .gte("data_postagem", `${ano}-01-01`)
          .lte("data_postagem", `${ano}-12-31`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar postagens:", error);
        throw error;
      }

      return data as Postagem[];
    },
  });
}

// Hook para postagens de um dia específico
export function usePostagensPorDia(data: string) {
  return useQuery({
    queryKey: ["postagens-dia", data],
    queryFn: async () => {
      if (!data) return [];
      
      const { data: postagens, error } = await supabase
        .from("postagens")
        .select("*")
        .eq("data_postagem", data)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar postagens do dia:", error);
        throw error;
      }

      return postagens as Postagem[];
    },
    enabled: !!data,
  });
}

// Hook para estatísticas agregadas
export function usePostagensStats(ano: number, mes?: number) {
  return useQuery({
    queryKey: ["postagens-stats", ano, mes],
    queryFn: async () => {
      let query = supabase
        .from("postagens")
        .select("curtidas, visualizacoes, data_postagem");

      if (mes) {
        const startDate = `${ano}-${String(mes).padStart(2, "0")}-01`;
        const endDate = `${ano}-${String(mes).padStart(2, "0")}-31`;
        query = query.gte("data_postagem", startDate).lte("data_postagem", endDate);
      } else {
        query = query
          .gte("data_postagem", `${ano}-01-01`)
          .lte("data_postagem", `${ano}-12-31`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const postagens = data || [];
      const total_mes = postagens.length;

      // Calcular total da semana atual
      const hoje = new Date();
      const primeiroDiaSemana = new Date(hoje);
      primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
      const ultimoDiaSemana = new Date(primeiroDiaSemana);
      ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);

      const total_semana = postagens.filter((p) => {
        const dataPost = new Date(p.data_postagem);
        return dataPost >= primeiroDiaSemana && dataPost <= ultimoDiaSemana;
      }).length;

      const media_curtidas =
        total_mes > 0
          ? Math.round(
              postagens.reduce((acc, p) => acc + (p.curtidas || 0), 0) /
                total_mes
            )
          : 0;

      const media_visualizacoes =
        total_mes > 0
          ? Math.round(
              postagens.reduce((acc, p) => acc + (p.visualizacoes || 0), 0) /
                total_mes
            )
          : 0;

      return {
        total_mes,
        total_semana,
        media_curtidas,
        media_visualizacoes,
      } as PostagensStats;
    },
  });
}

// Hook para criar postagem
export function useCreatePostagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postagem: Omit<Postagem, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("postagens")
        .insert({
          ...postagem,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postagens"] });
      queryClient.invalidateQueries({ queryKey: ["postagens-stats"] });
      toast.success("Postagem criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar postagem:", error);
      toast.error("Erro ao criar postagem");
    },
  });
}

// Hook para atualizar postagem
export function useUpdatePostagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...postagem }: Partial<Postagem> & { id: string }) => {
      const { data, error } = await supabase
        .from("postagens")
        .update(postagem)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postagens"] });
      queryClient.invalidateQueries({ queryKey: ["postagens-stats"] });
      queryClient.invalidateQueries({ queryKey: ["postagens-dia"] });
      toast.success("Postagem atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar postagem:", error);
      toast.error("Erro ao atualizar postagem");
    },
  });
}

// Hook para deletar postagem
export function useDeletePostagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("postagens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postagens"] });
      queryClient.invalidateQueries({ queryKey: ["postagens-stats"] });
      queryClient.invalidateQueries({ queryKey: ["postagens-dia"] });
      toast.success("Postagem excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir postagem:", error);
      toast.error("Erro ao excluir postagem");
    },
  });
}
