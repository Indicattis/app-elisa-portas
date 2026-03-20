import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MissaoCheckbox {
  id: string;
  missao_id: string;
  descricao: string;
  concluida: boolean;
  ordem: number;
  created_at: string;
}

export interface Missao {
  id: string;
  titulo: string;
  prazo: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  missao_checkboxes: MissaoCheckbox[];
}

export function useMissoes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: missoes = [], isLoading } = useQuery({
    queryKey: ["missoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missoes")
        .select("*, missao_checkboxes(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]).map((m) => ({
        ...m,
        missao_checkboxes: (m.missao_checkboxes || []).sort(
          (a: MissaoCheckbox, b: MissaoCheckbox) => a.ordem - b.ordem
        ),
      })) as Missao[];
    },
  });

  const criarMissao = useMutation({
    mutationFn: async (params: {
      titulo: string;
      prazo: string;
      checkboxes: { descricao: string }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: missao, error: missaoError } = await supabase
        .from("missoes")
        .insert({ titulo: params.titulo, prazo: params.prazo, created_by: user.id })
        .select()
        .single();

      if (missaoError) throw missaoError;

      if (params.checkboxes.length > 0) {
        const checkboxes = params.checkboxes.map((cb, i) => ({
          missao_id: missao.id,
          descricao: cb.descricao,
          ordem: i,
        }));
        const { error: cbError } = await supabase
          .from("missao_checkboxes")
          .insert(checkboxes);
        if (cbError) throw cbError;
      }

      return missao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
      toast({ title: "Missão criada com sucesso" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao criar missão", description: error.message });
    },
  });

  const deletarMissao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("missoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
      toast({ title: "Missão excluída" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    },
  });

  const toggleCheckbox = useMutation({
    mutationFn: async ({ id, concluida }: { id: string; concluida: boolean }) => {
      const { error } = await supabase
        .from("missao_checkboxes")
        .update({ concluida })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
  });

  return { missoes, isLoading, criarMissao, deletarMissao, toggleCheckbox };
}
