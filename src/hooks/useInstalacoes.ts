import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instalacao, InstalacaoFormData } from "@/types/instalacao";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export const useInstalacoes = (startDate?: Date, viewMode: 'week' | 'month' = 'week') => {
  const queryClient = useQueryClient();

  const { data: instalacoes = [], isLoading } = useQuery({
    queryKey: ["instalacoes", startDate?.toISOString(), viewMode],
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
            endereco_completo,
            data_venda
          ),
          pedido:pedidos_producao(
            id,
            numero_pedido,
            etapa_atual
          )
        `)
        .order("data_carregamento", { ascending: true });

      if (startDate) {
        let start: Date;
        let end: Date;
        
        if (viewMode === 'month') {
          const monthStart = startOfMonth(startDate);
          const monthEnd = endOfMonth(startDate);
          start = startOfWeek(monthStart, { weekStartsOn: 0 });
          end = endOfWeek(monthEnd, { weekStartsOn: 0 });
        } else {
          start = startOfWeek(startDate, { weekStartsOn: 0 });
          end = endOfWeek(startDate, { weekStartsOn: 0 });
        }
        
        query = query
          .gte("data_carregamento", start.toISOString().split("T")[0])
          .lte("data_carregamento", end.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(ordem => ({
        id: ordem.id,
        id_venda: ordem.venda_id,
        data: ordem.data_carregamento,
        hora: ordem.hora_carregamento || ordem.hora || '08:00',
        nome_cliente: ordem.nome_cliente,
        equipe_id: ordem.responsavel_carregamento_id,
        tipo_instalacao: ordem.tipo_carregamento,
        responsavel_instalacao_id: ordem.responsavel_carregamento_id,
        responsavel_instalacao_nome: ordem.responsavel_carregamento_nome,
        venda: ordem.venda,
        pedido: ordem.pedido,
        created_at: ordem.created_at,
        updated_at: ordem.updated_at,
        venda_id: ordem.venda_id,
        pedido_id: ordem.pedido_id,
        status: ordem.status,
        instalacao_concluida: ordem.carregamento_concluido,
        latitude: ordem.latitude,
        longitude: ordem.longitude
      })) as Instalacao[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (instalacao: InstalacaoFormData) => {
      const { data, error } = await supabase
        .from("ordens_carregamento")
        .insert([{
          nome_cliente: instalacao.nome_cliente,
          venda_id: instalacao.id_venda,
          data_carregamento: instalacao.data,
          hora_carregamento: instalacao.hora,
          hora: instalacao.hora,
          responsavel_carregamento_id: instalacao.equipe_id,
          status: 'pronta_fabrica',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Ordem de carregamento cadastrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar ordem:", error);
      toast.error("Erro ao cadastrar ordem de carregamento");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InstalacaoFormData> & { tipo_instalacao?: 'elisa' | 'autorizados'; responsavel_instalacao_nome?: string; responsavel_instalacao_id?: string } }) => {
      const updateData: any = {};
      
      if (data.nome_cliente) updateData.nome_cliente = data.nome_cliente;
      if (data.data !== undefined) updateData.data_carregamento = data.data;
      if (data.hora) {
        updateData.hora_carregamento = data.hora;
        updateData.hora = data.hora;
      }
      if (data.equipe_id !== undefined) updateData.responsavel_carregamento_id = data.equipe_id;
      if (data.tipo_instalacao !== undefined) updateData.tipo_carregamento = data.tipo_instalacao;
      if (data.responsavel_instalacao_nome !== undefined) updateData.responsavel_carregamento_nome = data.responsavel_instalacao_nome;
      if (data.responsavel_instalacao_id !== undefined) updateData.responsavel_carregamento_id = data.responsavel_instalacao_id;

      const { data: updated, error } = await supabase
        .from("ordens_carregamento")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Ordem de carregamento atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de carregamento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordens_carregamento")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Ordem de carregamento removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar ordem:", error);
      toast.error("Erro ao remover ordem de carregamento");
    },
  });

  return {
    instalacoes,
    isLoading,
    createInstalacao: createMutation.mutateAsync,
    updateInstalacao: updateMutation.mutateAsync,
    deleteInstalacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
