import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";

export interface OrdemCarregamentoInstalacao {
  id: string;
  nome_cliente: string;
  data_carregamento: string | null;
  hora_carregamento: string | null;
  status: string;
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string | null;
  responsavel_carregamento_tipo: string | null;
  venda_id: string | null;
  pedido_id: string | null;
  observacoes: string | null;
  latitude: number | null;
  longitude: number | null;
  venda?: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string | null;
    cliente_email: string | null;
    estado: string | null;
    cidade: string | null;
    cep: string | null;
    bairro: string | null;
    endereco_completo: string | null;
    tipo_entrega: string | null;
  } | null;
  pedido?: {
    id: string;
    numero_pedido: string;
    etapa_atual: string;
  } | null;
  equipe?: {
    id: string;
    nome: string;
    cor: string | null;
  } | null;
}

export const useOrdensCarregamentoInstalacao = (
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
    queryKey: ["ordens_carregamento_instalacao", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_carregamento")
        .select(`
          *,
          venda:vendas!ordens_carregamento_venda_id_fkey(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            endereco_completo,
            tipo_entrega
          ),
          pedido:pedidos_producao!ordens_carregamento_pedido_id_fkey(
            id,
            numero_pedido,
            etapa_atual
          )
        `)
        .gte("data_carregamento", inicio)
        .lte("data_carregamento", fim)
        .neq("status", "concluida")
        .order("data_carregamento", { ascending: true });

      if (error) throw error;

      // Filtrar apenas ordens de vendas do tipo instalação
      const ordensInstalacao = (data || []).filter((ordem: any) => {
        return ordem.venda?.tipo_entrega === 'instalacao';
      });

      // Buscar cores das equipes separadamente
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      return ordensInstalacao.map((item: any) => ({
        ...item,
        equipe: item.responsavel_carregamento_id && item.responsavel_carregamento_tipo === 'equipe_interna'
          ? equipesMap.get(item.responsavel_carregamento_id) || null
          : null
      })) as OrdemCarregamentoInstalacao[];
    },
  });

  const updateOrdemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrdemCarregamentoInstalacao> }) => {
      const { data: updated, error } = await supabase
        .from("ordens_carregamento")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_instalacao"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de carregamento");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('ordens-carregamento-instalacao-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_instalacao", inicio, fim] });
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
    isUpdating: updateOrdemMutation.isPending,
  };
};
