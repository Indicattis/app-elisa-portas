import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";
import { Correcao } from "@/types/correcao";

export const useCorrecoes = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week'
) => {
  const queryClient = useQueryClient();

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

  const { data: correcoes = [], isLoading } = useQuery({
    queryKey: ["correcoes_calendario", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("correcoes")
        .select("*")
        .gte("data_correcao", inicio)
        .lte("data_correcao", fim)
        .eq("concluida", false)
        .order("data_correcao", { ascending: true });

      if (error) throw error;

      // Buscar dados dos pedidos vinculados
      const pedidoIds = [...new Set((data || []).map(c => c.pedido_id).filter(Boolean))];
      const { data: pedidos } = pedidoIds.length > 0
        ? await supabase
            .from("pedidos_producao")
            .select("id, numero_pedido")
            .in("id", pedidoIds)
        : { data: [] };

      const pedidosMap = new Map((pedidos || []).map(p => [p.id, p]));

      return (data || []).map(item => ({
        ...item,
        _tipo: 'correcao_pedido' as const,
        pedido: item.pedido_id ? pedidosMap.get(item.pedido_id) || null : null,
      })) as Correcao[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Correcao> }) => {
      const { data: updated, error } = await supabase
        .from("correcoes")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["correcoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["correcoes_sem_data"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar correção:", error);
      toast.error("Erro ao atualizar correção");
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      // 1. Get the correcao to find pedido_id
      const { data: correcao, error: fetchError } = await supabase
        .from("correcoes")
        .select("pedido_id")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // 2. Mark correcao as concluded
      const { error: updateError } = await supabase
        .from("correcoes")
        .update({
          concluida: true,
          concluida_em: new Date().toISOString(),
          concluida_por: user.user?.id,
          status: 'finalizada',
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 3. Move pedido back to 'finalizado'
      if (correcao?.pedido_id) {
        // Close correcoes stage
        await supabase
          .from("pedidos_etapas")
          .update({ data_saida: new Date().toISOString() })
          .eq("pedido_id", correcao.pedido_id)
          .eq("etapa", "correcoes")
          .is("data_saida", null);

        // Reopen/upsert finalizado stage
        const { error: upsertError } = await supabase
          .from("pedidos_etapas")
          .upsert({
            pedido_id: correcao.pedido_id,
            etapa: 'finalizado',
            data_entrada: new Date().toISOString(),
            data_saida: null,
            checkboxes: {},
          }, { onConflict: 'pedido_id,etapa' });

        if (upsertError) console.error("Erro ao reabrir etapa finalizado:", upsertError);

        // Update etapa_atual
        await supabase
          .from("pedidos_producao")
          .update({ etapa_atual: 'finalizado' })
          .eq("id", correcao.pedido_id);

        // Register movement
        await supabase
          .from("pedidos_movimentacoes")
          .insert({
            pedido_id: correcao.pedido_id,
            etapa_origem: 'correcoes',
            etapa_destino: 'finalizado',
            user_id: user.user?.id || '',
            teor: 'avanco',
            descricao: 'Correção concluída - pedido retornou para finalizado'
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["correcoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["correcoes_sem_data"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
      toast.success("Correção concluída! Pedido retornou para finalizado.");
    },
    onError: (error) => {
      console.error("Erro ao concluir correção:", error);
      toast.error("Erro ao concluir correção");
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('correcoes-calendar-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'correcoes' }, () => {
        queryClient.invalidateQueries({ queryKey: ["correcoes_calendario", inicio, fim] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [inicio, fim, queryClient]);

  return {
    correcoes,
    isLoading,
    updateCorrecao: updateMutation.mutateAsync,
    concluirCorrecao: concluirMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isConcluindo: concluirMutation.isPending,
  };
};

// Hook para correções sem data (pendentes de agendamento)
export const useCorrecoesSemData = () => {
  const queryClient = useQueryClient();

  const { data: correcoesSemData = [], isLoading } = useQuery({
    queryKey: ["correcoes_sem_data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("correcoes")
        .select("*")
        .is("data_correcao", null)
        .eq("concluida", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const pedidoIds = [...new Set((data || []).map(c => c.pedido_id).filter(Boolean))];
      const { data: pedidos } = pedidoIds.length > 0
        ? await supabase
            .from("pedidos_producao")
            .select("id, numero_pedido")
            .in("id", pedidoIds)
        : { data: [] };

      const pedidosMap = new Map((pedidos || []).map(p => [p.id, p]));

      return (data || []).map(item => ({
        ...item,
        _tipo: 'correcao_pedido' as const,
        pedido: item.pedido_id ? pedidosMap.get(item.pedido_id) || null : null,
      })) as Correcao[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Correcao> }) => {
      const { data: updated, error } = await supabase
        .from("correcoes")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["correcoes_sem_data"] });
      queryClient.invalidateQueries({ queryKey: ["correcoes_calendario"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar correção:", error);
      toast.error("Erro ao atualizar correção");
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('correcoes-sem-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'correcoes' }, () => {
        queryClient.invalidateQueries({ queryKey: ["correcoes_sem_data"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return {
    correcoesSemData,
    isLoading,
    updateCorrecao: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
