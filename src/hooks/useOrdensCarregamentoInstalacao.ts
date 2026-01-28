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
        inicio: format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        fim: format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
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
      // Buscar ordens de carregamento
      const { data: ordensData, error: ordensError } = await supabase
        .from("ordens_carregamento")
        .select("*")
        .gte("data_carregamento", inicio)
        .lte("data_carregamento", fim)
        .neq("status", "concluida")
        .order("data_carregamento", { ascending: true });

      if (ordensError) throw ordensError;

      if (!ordensData || ordensData.length === 0) return [];

      // Buscar vendas relacionadas
      const vendaIds = [...new Set(ordensData.map(o => o.venda_id).filter(Boolean))];
      const { data: vendas } = vendaIds.length > 0 
        ? await supabase
            .from("vendas")
            .select("id, cliente_nome, cliente_telefone, cliente_email, estado, cidade, cep, bairro, endereco_completo, tipo_entrega")
            .in("id", vendaIds)
        : { data: [] };

      // Buscar pedidos relacionados
      const pedidoIds = [...new Set(ordensData.map(o => o.pedido_id).filter(Boolean))];
      const { data: pedidos } = pedidoIds.length > 0
        ? await supabase
            .from("pedidos_producao")
            .select("id, numero_pedido, etapa_atual")
            .in("id", pedidoIds)
        : { data: [] };

      // Buscar equipes
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      // Criar mapas para lookup rápido
      const vendasMap = new Map<string, any>(vendas?.map(v => [v.id, v] as [string, any]) || []);
      const pedidosMap = new Map<string, any>(pedidos?.map(p => [p.id, p] as [string, any]) || []);
      const equipesMap = new Map<string, any>(equipes?.map(e => [e.id, e] as [string, any]) || []);

      // Juntar dados e filtrar apenas instalações
      const ordensCompletas = ordensData
        .map((ordem: any) => {
          const venda = ordem.venda_id ? vendasMap.get(ordem.venda_id) : null;
          const pedido = ordem.pedido_id ? pedidosMap.get(ordem.pedido_id) : null;
          const equipe = ordem.responsavel_carregamento_id
            ? equipesMap.get(ordem.responsavel_carregamento_id)
            : null;

          return {
            ...ordem,
            venda,
            pedido,
            equipe
          };
        })
        .filter((ordem: any) => ordem.venda?.tipo_entrega === 'instalacao');

      return ordensCompletas as OrdemCarregamentoInstalacao[];
    },
  });

  const updateOrdemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrdemCarregamentoInstalacao> }) => {
      const { error } = await supabase
        .from("ordens_carregamento")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
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
