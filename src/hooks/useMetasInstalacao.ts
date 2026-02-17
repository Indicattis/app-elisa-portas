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

export function useProgressoMetaInstalacao(meta: MetaInstalacao | null) {
  return useQuery({
    queryKey: ["progresso-meta-instalacao", meta?.id],
    enabled: !!meta,
    queryFn: async () => {
      let query = supabase
        .from("neo_instalacoes" as any)
        .select("id", { count: "exact", head: true })
        .eq("concluida", true)
        .gte("concluida_em", meta!.data_inicio)
        .lte("concluida_em", meta!.data_termino + "T23:59:59");

      if (meta!.tipo === "equipe") {
        query = query.eq("equipe_id", meta!.referencia_id);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });
}

function classificarTamanho(metragem: number | null | undefined): 'P' | 'G' | 'GG' | null {
  if (metragem == null || metragem === 0) return null;
  if (metragem < 25) return 'P';
  if (metragem <= 50) return 'G';
  return 'GG';
}

export interface TamanhoContagem {
  P: number;
  G: number;
  GG: number;
}

export function useTamanhosMetaInstalacao(meta: MetaInstalacao | null) {
  return useQuery({
    queryKey: ["tamanhos-meta-instalacao", meta?.id],
    enabled: !!meta,
    queryFn: async () => {
      // Buscar instalações de pedido concluídas no período
      let pedidoQuery = supabase
        .from("instalacoes" as any)
        .select("id, pedido_id")
        .eq("instalacao_concluida", true)
        .not("pedido_id", "is", null)
        .gte("instalacao_concluida_em", meta!.data_inicio)
        .lte("instalacao_concluida_em", meta!.data_termino + "T23:59:59");

      if (meta!.tipo === "equipe") {
        pedidoQuery = pedidoQuery.eq("responsavel_instalacao_id", meta!.referencia_id);
      }

      const { data: pedidoData, error: pedidoError } = await pedidoQuery;
      if (pedidoError) throw pedidoError;

      const pedidos = (pedidoData || []) as any[];
      const pedidoIds = pedidos.map((p: any) => p.pedido_id).filter(Boolean) as string[];

      const contagem: TamanhoContagem = { P: 0, G: 0, GG: 0 };

      if (pedidoIds.length > 0) {
        const { data: ordens } = await supabase
          .from("ordens_pintura" as any)
          .select("pedido_id, metragem_quadrada")
          .in("pedido_id", pedidoIds);

        // Agrupar metragem por pedido_id
        const metragensMap: Record<string, number> = {};
        if (ordens) {
          for (const o of ordens as any[]) {
            if (o.metragem_quadrada) {
              metragensMap[o.pedido_id] = (metragensMap[o.pedido_id] || 0) + o.metragem_quadrada;
            }
          }
        }

        for (const p of pedidos) {
          const tam = classificarTamanho(metragensMap[p.pedido_id]);
          if (tam) contagem[tam]++;
        }
      }

      return contagem;
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
