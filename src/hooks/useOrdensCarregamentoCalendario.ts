import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";

export const useOrdensCarregamentoCalendario = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week'
) => {
  const queryClient = useQueryClient();

  // Calcular intervalo de datas baseado no período
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

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens_carregamento_calendario", inicio, fim],
    queryFn: async () => {
      // 1. Buscar de ordens_carregamento
      const { data: ordensCarregamento, error: errorOrdens } = await supabase
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
            data_prevista_entrega,
            tipo_entrega,
            produtos:produtos_vendas(
              tipo_produto,
              tamanho,
              largura,
              altura,
              quantidade,
              cor:catalogo_cores(
                nome,
                codigo_hex
              )
            )
          ),
          pedido:pedidos_producao!ordens_carregamento_pedido_id_fkey(
            id,
            numero_pedido,
            etapa_atual,
            instalacao:instalacoes(
              id,
              responsavel_instalacao_id,
              responsavel_instalacao_nome
            )
          )
        `)
        .gte("data_carregamento", inicio)
        .lte("data_carregamento", fim)
        .order("data_carregamento", { ascending: true });

      if (errorOrdens) throw errorOrdens;

      // 2. Buscar instalações com data_carregamento agendada
      const { data: instalacoes, error: errorInstalacoes } = await supabase
        .from("instalacoes")
        .select(`
          id,
          nome_cliente,
          data_carregamento,
          hora_carregamento,
          tipo_carregamento,
          responsavel_carregamento_id,
          responsavel_carregamento_nome,
          status,
          carregamento_concluido,
          observacoes,
          created_at,
          updated_at,
          pedido:pedidos_producao(
            id,
            numero_pedido,
            etapa_atual
          ),
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            data_prevista_entrega,
            tipo_entrega,
            produtos:produtos_vendas(
              tipo_produto,
              tamanho,
              largura,
              altura,
              quantidade,
              cor:catalogo_cores(
                nome,
                codigo_hex
              )
            )
          )
        `)
        .not("data_carregamento", "is", null)
        .gte("data_carregamento", inicio)
        .lte("data_carregamento", fim)
        .eq("carregamento_concluido", false);

      if (errorInstalacoes) throw errorInstalacoes;

      // 3. Normalizar instalações para o formato OrdemCarregamento
      const instalacoesNormalizadas = (instalacoes || []).map((inst: any) => ({
        id: inst.id,
        pedido_id: inst.pedido?.id || null,
        venda_id: inst.venda?.id || null,
        nome_cliente: inst.nome_cliente,
        tipo_carregamento: inst.tipo_carregamento,
        data_carregamento: inst.data_carregamento,
        hora: inst.hora_carregamento,
        hora_carregamento: inst.hora_carregamento,
        responsavel_carregamento_id: inst.responsavel_carregamento_id,
        responsavel_carregamento_nome: inst.responsavel_carregamento_nome,
        status: inst.status,
        carregamento_concluido: inst.carregamento_concluido,
        carregamento_concluido_em: null,
        carregamento_concluido_por: null,
        latitude: null,
        longitude: null,
        geocode_precision: null,
        last_geocoded_at: null,
        observacoes: inst.observacoes,
        created_at: inst.created_at,
        updated_at: inst.updated_at,
        created_by: null,
        fonte: 'instalacoes' as const,
        pedido: inst.pedido ? {
          id: inst.pedido.id,
          numero_pedido: inst.pedido.numero_pedido,
          etapa_atual: inst.pedido.etapa_atual,
          instalacao: null
        } : undefined,
        venda: inst.venda
      }));

      // 4. Marcar ordens_carregamento com fonte
      const ordensComFonte = (ordensCarregamento || []).map((ordem: any) => ({
        ...ordem,
        fonte: 'ordens_carregamento' as const
      }));

      // 5. Filtrar ordens com status concluído e combinar
      const filteredOrdens = ordensComFonte.filter((ordem: any) => ordem.status !== 'concluida');
      const filteredInstalacoes = instalacoesNormalizadas.filter((inst: any) => inst.status !== 'concluida');
      
      return [...filteredOrdens, ...filteredInstalacoes] as OrdemCarregamento[];
    },
  });

  const updateOrdemMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data,
      fonte = 'ordens_carregamento' 
    }: { 
      id: string; 
      data: Partial<OrdemCarregamento>;
      fonte?: 'ordens_carregamento' | 'instalacoes';
    }) => {
      // Rotear para a tabela correta baseado na fonte
      if (fonte === 'instalacoes') {
        const { error } = await supabase
          .from("instalacoes")
          .update({
            data_carregamento: data.data_carregamento,
            hora_carregamento: data.hora,
            tipo_carregamento: data.tipo_carregamento,
            responsavel_carregamento_id: data.responsavel_carregamento_id,
            responsavel_carregamento_nome: data.responsavel_carregamento_nome,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ordens_carregamento")
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de carregamento");
    },
  });

  const deleteOrdemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordens_carregamento")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
      toast.success("Ordem excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar ordem:", error);
      toast.error("Erro ao excluir ordem de carregamento");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('ordens-carregamento-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento'
        },
        () => {
          // Invalidar queries para recarregar dados
          queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario", inicio, fim] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inicio, fim, queryClient]);

  return {
    ordens,
    isLoading,
    updateOrdem: updateOrdemMutation.mutateAsync,
    deleteOrdem: deleteOrdemMutation.mutateAsync,
    isUpdating: updateOrdemMutation.isPending,
    isDeleting: deleteOrdemMutation.isPending,
  };
};
