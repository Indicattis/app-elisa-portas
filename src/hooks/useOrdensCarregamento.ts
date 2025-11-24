import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrdemCarregamento, AgendarCarregamentoData } from "@/types/ordemCarregamento";

export const useOrdensCarregamento = (filters?: {
  status?: string;
  tipo_carregamento?: string;
  responsavel_tipo?: string;
  data_inicio?: string;
  data_fim?: string;
}) => {
  const queryClient = useQueryClient();

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens_carregamento", filters],
    queryFn: async () => {
      let query = supabase
        .from("ordens_carregamento")
        .select(`
          *,
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            data_prevista_entrega
          ),
          pedido:pedidos_producao(
            id,
            numero_pedido,
            etapa_atual,
            data_producao
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      
      if (filters?.tipo_carregamento) {
        query = query.eq("tipo_carregamento", filters.tipo_carregamento as any);
      }
      
      if (filters?.responsavel_tipo) {
        query = query.eq("responsavel_tipo", filters.responsavel_tipo as any);
      }

      if (filters?.data_inicio) {
        query = query.gte("data_carregamento", filters.data_inicio);
      }

      if (filters?.data_fim) {
        query = query.lte("data_carregamento", filters.data_fim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as OrdemCarregamento[];
    },
  });

  const agendarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AgendarCarregamentoData }) => {
      const { data: updated, error } = await supabase
        .from("ordens_carregamento")
        .update({
          data_carregamento: data.data_carregamento,
          hora: data.hora,
          responsavel_tipo: data.responsavel_tipo,
          responsavel_carregamento_id: data.responsavel_carregamento_id,
          responsavel_carregamento_nome: data.responsavel_carregamento_nome,
          status: 'agendada',
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
      toast.success("Carregamento agendado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao agendar carregamento:", error);
      toast.error("Erro ao agendar carregamento");
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes?: string }) => {
      const user = await supabase.auth.getUser();
      
      const { data: updated, error } = await supabase
        .from("ordens_carregamento")
        .update({
          carregamento_concluido: true,
          carregamento_concluido_em: new Date().toISOString(),
          carregamento_concluido_por: user.data.user?.id,
          status: 'concluida',
          observacoes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos-producao"] });
      toast.success("Carregamento concluído! Pedido finalizado automaticamente.");
    },
    onError: (error) => {
      console.error("Erro ao concluir carregamento:", error);
      toast.error("Erro ao concluir carregamento");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: updated, error } = await supabase
        .from("ordens_carregamento")
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    },
  });

  return {
    ordens,
    isLoading,
    agendarCarregamento: agendarMutation.mutateAsync,
    concluirCarregamento: concluirMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isAgendando: agendarMutation.isPending,
    isConcluindo: concluirMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
  };
};
