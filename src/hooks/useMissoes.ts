import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MissaoCheckbox {
  id: string;
  missao_id: string;
  descricao: string;
  concluida: boolean;
  ordem: number;
  prazo: string | null;
  concluida_em: string | null;
  created_at: string;
}

export interface Missao {
  id: string;
  titulo: string;
  responsavel_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  ordem: number;
  missao_checkboxes: MissaoCheckbox[];
  responsavel?: { nome: string; foto_perfil_url: string | null } | null;
}

export function useMissoes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: missoes = [], isLoading } = useQuery({
    queryKey: ["missoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("missoes")
        .select("*, missao_checkboxes(*)")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch responsavel info separately
      const missoesList = (data as any[]).map((m: any) => ({
        ...m,
        missao_checkboxes: (m.missao_checkboxes || []).sort(
          (a: MissaoCheckbox, b: MissaoCheckbox) => a.ordem - b.ordem
        ),
      }));

      // Get unique responsavel_ids
      const responsavelIds = [...new Set(missoesList.map(m => m.responsavel_id).filter(Boolean))];
      let responsaveisMap: Record<string, { nome: string; foto_perfil_url: string | null }> = {};

      if (responsavelIds.length > 0) {
        const { data: users } = await supabase
          .from("admin_users")
          .select("user_id, nome, foto_perfil_url")
          .in("user_id", responsavelIds);
        if (users) {
          users.forEach(u => {
            responsaveisMap[u.user_id] = { nome: u.nome, foto_perfil_url: u.foto_perfil_url };
          });
        }
      }

      return missoesList.map(m => ({
        ...m,
        responsavel: m.responsavel_id ? responsaveisMap[m.responsavel_id] || null : null,
      })) as Missao[];
    },
  });

  const criarMissao = useMutation({
    mutationFn: async (params: {
      titulo: string;
      responsavel_id?: string;
      checkboxes: { descricao: string; prazo?: string }[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const insertData: any = { titulo: params.titulo, created_by: user.id };
      if (params.responsavel_id) insertData.responsavel_id = params.responsavel_id;

      const { data: missao, error: missaoError } = await (supabase as any)
        .from("missoes")
        .insert(insertData)
        .select()
        .single();

      if (missaoError) throw missaoError;

      if (params.checkboxes.length > 0) {
        const checkboxes = params.checkboxes.map((cb, i) => ({
          missao_id: missao.id,
          descricao: cb.descricao,
          prazo: cb.prazo || null,
          ordem: i,
        }));
        const { error: cbError } = await (supabase as any)
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
      const { error } = await (supabase as any).from("missoes").delete().eq("id", id);
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
      const updateData: any = { concluida, concluida_em: concluida ? new Date().toISOString() : null };
      const { error } = await (supabase as any)
        .from("missao_checkboxes")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
  });

  const editarCheckbox = useMutation({
    mutationFn: async ({ id, descricao }: { id: string; descricao: string }) => {
      const { error } = await (supabase as any)
        .from("missao_checkboxes")
        .update({ descricao })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao editar", description: error.message });
    },
  });

  const reordenarCheckboxes = useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) => {
      for (const item of items) {
        const { error } = await (supabase as any)
          .from("missao_checkboxes")
          .update({ ordem: item.ordem })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao reordenar", description: error.message });
    },
  });

  const deletarCheckbox = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("missao_checkboxes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao excluir item", description: error.message });
    },
  });

  const editarPrazoCheckbox = useMutation({
    mutationFn: async ({ id, prazo }: { id: string; prazo: string | null }) => {
      const { error } = await (supabase as any)
        .from("missao_checkboxes")
        .update({ prazo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao editar prazo", description: error.message });
    },
  });

  const adicionarCheckbox = useMutation({
    mutationFn: async (params: { missao_id: string; descricao: string; ordem: number; prazo?: string }) => {
      const { error } = await (supabase as any)
        .from("missao_checkboxes")
        .insert({
          missao_id: params.missao_id,
          descricao: params.descricao,
          ordem: params.ordem,
          prazo: params.prazo || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao adicionar item", description: error.message });
    },
  });

  const reordenarMissoes = useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) => {
      for (const item of items) {
        const { error } = await (supabase as any)
          .from("missoes")
          .update({ ordem: item.ordem })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoes"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao reordenar", description: error.message });
    },
  });

  return { missoes, isLoading, criarMissao, deletarMissao, toggleCheckbox, editarCheckbox, reordenarCheckboxes, deletarCheckbox, editarPrazoCheckbox, adicionarCheckbox, reordenarMissoes };
}
