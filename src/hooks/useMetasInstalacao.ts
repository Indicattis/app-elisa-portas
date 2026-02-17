import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MetaInstalacao {
  id: string;
  tipo: "equipe" | "gerente";
  referencia_id: string;
  quantidade_portas: number;
  data_inicio: string;
  data_termino: string;
  concluida: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useMetasInstalacao() {
  return useQuery({
    queryKey: ["metas-instalacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metas_instalacao" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as MetaInstalacao[];
    },
  });
}

export function useMetaAtiva(tipo: "equipe" | "gerente", referenciaId: string | undefined) {
  return useQuery({
    queryKey: ["meta-instalacao-ativa", tipo, referenciaId],
    enabled: !!referenciaId,
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("metas_instalacao" as any)
        .select("*")
        .eq("tipo", tipo)
        .eq("referencia_id", referenciaId!)
        .gte("data_termino", hoje)
        .eq("concluida", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      return ((data as any)?.[0] as MetaInstalacao) || null;
    },
  });
}

export function useCriarMetaInstalacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meta: {
      tipo: "equipe" | "gerente";
      referencia_id: string;
      quantidade_portas: number;
      data_inicio: string;
      data_termino: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("metas_instalacao" as any)
        .insert({ ...meta, created_by: user?.id } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-instalacao"] });
      queryClient.invalidateQueries({ queryKey: ["meta-instalacao-ativa"] });
      toast({ title: "Meta criada", description: "A meta foi criada com sucesso." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao criar meta", description: error.message });
    },
  });
}

export function useAtualizarMetaInstalacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MetaInstalacao> & { id: string }) => {
      const { data, error } = await supabase
        .from("metas_instalacao" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-instalacao"] });
      queryClient.invalidateQueries({ queryKey: ["meta-instalacao-ativa"] });
      toast({ title: "Meta atualizada", description: "A meta foi atualizada com sucesso." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao atualizar meta", description: error.message });
    },
  });
}
