import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface UseOrdensMinhaEquipeResult {
  ordens: OrdemCarregamento[];
  isLoading: boolean;
  equipeId: string | null;
  equipeNome: string | null;
  equipeCor: string | null;
  temEquipe: boolean;
  updateOrdem: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<any>;
  isUpdating: boolean;
}

export const useOrdensMinhaEquipe = (
  currentDate: Date,
  periodo: 'week' | 'month' = 'week'
): UseOrdensMinhaEquipeResult => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Primeiro, buscar a equipe do usuário logado via membros
  const { data: equipeData, isLoading: isLoadingEquipe } = useQuery({
    queryKey: ["minha_equipe_instalacao", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Buscar a equipe do usuário via tabela de membros
      const { data: membroData, error: membroError } = await supabase
        .from("equipes_instalacao_membros")
        .select("equipe_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membroError) {
        console.error("Erro ao buscar membro da equipe:", membroError);
        return null;
      }

      if (!membroData?.equipe_id) {
        return null;
      }

      // Buscar detalhes da equipe
      const { data: equipe, error: equipeError } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("id", membroData.equipe_id)
        .eq("ativa", true)
        .maybeSingle();

      if (equipeError) {
        console.error("Erro ao buscar equipe:", equipeError);
        return null;
      }

      return equipe;
    },
    enabled: !!user?.id,
  });

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

  // Buscar ordens de carregamento da equipe
  const { data: ordens = [], isLoading: isLoadingOrdens } = useQuery({
    queryKey: ["ordens_minha_equipe", equipeData?.id, inicio, fim],
    queryFn: async () => {
      if (!equipeData?.id) return [];

      // Buscar ordens que têm instalação atribuída à equipe do usuário
      const { data, error } = await supabase
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

      if (error) throw error;

      // Filtrar apenas as ordens que pertencem à equipe do usuário
      // através da tabela instalacoes -> responsavel_instalacao_id
      const ordensEquipe = (data || []).filter((ordem: any) => {
        // Verificar se tem instalação e se a equipe responsável é a do usuário
        const instalacoes = ordem.pedido?.instalacao;
        if (!instalacoes || instalacoes.length === 0) return false;
        
        return instalacoes.some((inst: any) => 
          inst.responsavel_instalacao_id === equipeData.id
        );
      });

      // Filtrar ordens com status concluído
      const filteredData = ordensEquipe.filter((ordem: any) => {
        return ordem.status !== 'concluida';
      });

      return filteredData as OrdemCarregamento[];
    },
    enabled: !!equipeData?.id,
  });

  const updateOrdemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrdemCarregamento> }) => {
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
      queryClient.invalidateQueries({ queryKey: ["ordens_minha_equipe"] });
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de carregamento");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    if (!equipeData?.id) return;

    const channel = supabase
      .channel('ordens-minha-equipe-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_minha_equipe", equipeData.id, inicio, fim] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipeData?.id, inicio, fim, queryClient]);

  return {
    ordens,
    isLoading: isLoadingEquipe || isLoadingOrdens,
    equipeId: equipeData?.id || null,
    equipeNome: equipeData?.nome || null,
    equipeCor: equipeData?.cor || null,
    temEquipe: !!equipeData?.id,
    updateOrdem: updateOrdemMutation.mutateAsync,
    isUpdating: updateOrdemMutation.isPending,
  };
};
