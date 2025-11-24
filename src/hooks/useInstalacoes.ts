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
        .from("instalacoes")
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
            data_venda
          ),
          pedido:pedidos_producao(
            id,
            numero_pedido,
            etapa_atual
          )
        `)
        .order("data_instalacao", { ascending: true });

      if (startDate) {
        let start: Date;
        let end: Date;
        
        if (viewMode === 'month') {
          // Para modo mensal, buscar desde o início do mês até o final
          const monthStart = startOfMonth(startDate);
          const monthEnd = endOfMonth(startDate);
          // Expandir para incluir semanas completas no calendário
          start = startOfWeek(monthStart, { weekStartsOn: 0 });
          end = endOfWeek(monthEnd, { weekStartsOn: 0 });
        } else {
          // Para modo semanal, buscar apenas a semana
          start = startOfWeek(startDate, { weekStartsOn: 0 });
          end = endOfWeek(startDate, { weekStartsOn: 0 });
        }
        
        query = query
          .gte("data_instalacao", start.toISOString().split("T")[0])
          .lte("data_instalacao", end.toISOString().split("T")[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Mapear para o formato Instalacao compatível
      return (data || []).map(inst => ({
        id: inst.id,
        id_venda: inst.venda_id,
        data: inst.data_instalacao || '',
        hora: inst.hora || '08:00',
        nome_cliente: inst.nome_cliente,
        cidade: inst.cidade,
        estado: inst.estado,
        produto: inst.produto || '',
        equipe_id: inst.responsavel_instalacao_id,
        venda: inst.venda,
        pedido: inst.pedido,
        created_at: inst.created_at,
        updated_at: inst.updated_at
      })) as Instalacao[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (instalacao: InstalacaoFormData) => {
      const { data, error } = await supabase
        .from("instalacoes")
        .insert([{
          nome_cliente: instalacao.nome_cliente,
          telefone_cliente: instalacao.telefone_cliente,
          cidade: instalacao.cidade,
          estado: instalacao.estado,
          data_instalacao: instalacao.data,
          hora: instalacao.hora,
          produto: instalacao.produto,
          responsavel_instalacao_id: instalacao.equipe_id,
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
      toast.success("Instalação cadastrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar instalação:", error);
      toast.error("Erro ao cadastrar instalação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InstalacaoFormData> }) => {
      const updateData: any = {};
      
      if (data.nome_cliente) updateData.nome_cliente = data.nome_cliente;
      if (data.telefone_cliente !== undefined) updateData.telefone_cliente = data.telefone_cliente;
      if (data.cidade) updateData.cidade = data.cidade;
      if (data.estado) updateData.estado = data.estado;
      if (data.data) updateData.data_instalacao = data.data;
      if (data.hora) updateData.hora = data.hora;
      if (data.produto) updateData.produto = data.produto;
      if (data.equipe_id !== undefined) updateData.responsavel_instalacao_id = data.equipe_id;

      const { data: updated, error } = await supabase
        .from("instalacoes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar instalação:", error);
      toast.error("Erro ao atualizar instalação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instalacoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar instalação:", error);
      toast.error("Erro ao remover instalação");
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
