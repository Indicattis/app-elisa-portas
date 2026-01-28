import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { EtapaPedido } from "@/types/pedidoEtapa";

interface OrdemProducao {
  id: string;
  numero_ordem: string;
  status: string;
  tipo: 'soldagem' | 'perfiladeira' | 'separacao' | 'pintura';
  pausada?: boolean;
}

export interface OrdemConfig {
  tipo: 'soldagem' | 'perfiladeira' | 'separacao' | 'pintura';
  acao: 'manter' | 'pausar' | 'reativar' | 'resetar';
  justificativa?: string;
}

interface RetrocederParams {
  pedidoId: string;
  etapaDestino: EtapaPedido;
  motivo: string;
  ordensConfig?: OrdemConfig[];
}

export function useRetrocederPedido(pedidoId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Query para buscar ordens de produção do pedido
  const { data: ordensProducao, isLoading: isLoadingOrdens } = useQuery({
    queryKey: ['ordens-producao-pedido', pedidoId],
    queryFn: async (): Promise<OrdemProducao[]> => {
      if (!pedidoId) return [];

      const ordens: OrdemProducao[] = [];

      // Buscar ordens de soldagem
      const { data: soldagem } = await supabase
        .from('ordens_soldagem')
        .select('id, numero_ordem, status, pausada')
        .eq('pedido_id', pedidoId)
        .maybeSingle();

      if (soldagem) {
        ordens.push({
          id: soldagem.id,
          numero_ordem: soldagem.numero_ordem || '',
          status: soldagem.status || 'pendente',
          tipo: 'soldagem',
          pausada: soldagem.pausada || false,
        });
      }

      // Buscar ordens de perfiladeira
      const { data: perfiladeira } = await supabase
        .from('ordens_perfiladeira')
        .select('id, numero_ordem, status, pausada')
        .eq('pedido_id', pedidoId)
        .maybeSingle();

      if (perfiladeira) {
        ordens.push({
          id: perfiladeira.id,
          numero_ordem: perfiladeira.numero_ordem || '',
          status: perfiladeira.status || 'pendente',
          tipo: 'perfiladeira',
          pausada: perfiladeira.pausada || false,
        });
      }

      // Buscar ordens de separação
      const { data: separacao } = await supabase
        .from('ordens_separacao')
        .select('id, numero_ordem, status, pausada')
        .eq('pedido_id', pedidoId)
        .maybeSingle();

      if (separacao) {
        ordens.push({
          id: separacao.id,
          numero_ordem: separacao.numero_ordem || '',
          status: separacao.status || 'pendente',
          tipo: 'separacao',
          pausada: separacao.pausada || false,
        });
      }

      // Buscar ordem de pintura
      const { data: pintura } = await supabase
        .from('ordens_pintura')
        .select('id, numero_ordem, status, em_backlog')
        .eq('pedido_id', pedidoId)
        .maybeSingle();

      if (pintura) {
        ordens.push({
          id: pintura.id,
          numero_ordem: pintura.numero_ordem || '',
          status: pintura.status || 'pendente',
          tipo: 'pintura',
          pausada: false,
        });
      }

      return ordens;
    },
    enabled: !!pedidoId,
  });

  // Mutation para executar retrocesso
  const retrocederPedido = useMutation({
    mutationFn: async (params: RetrocederParams) => {
      // Cast ordensConfig to JSON-compatible format
      const ordensConfigJson = (params.ordensConfig || []).map(config => ({
        tipo: config.tipo,
        acao: config.acao,
        justificativa: config.justificativa || null,
      }));

      const { data, error } = await supabase.rpc('retroceder_pedido_unificado', {
        p_pedido_id: params.pedidoId,
        p_etapa_destino: params.etapaDestino,
        p_motivo: params.motivo,
        p_ordens_config: ordensConfigJson,
        p_user_id: user?.id || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Erro ao retroceder pedido');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidar todas as queries relevantes
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-instalacao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-producao-pedido'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-soldagem'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-perfiladeira'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-separacao'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-qualidade'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-pintura'] });

      toast({
        title: "Pedido retornado",
        description: "O pedido foi movido para a etapa anterior com sucesso",
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao retroceder pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível retroceder o pedido",
        variant: "destructive",
      });
    },
  });

  return {
    ordensProducao: ordensProducao || [],
    isLoadingOrdens,
    retrocederPedido,
    isRetrocedendo: retrocederPedido.isPending,
  };
}
