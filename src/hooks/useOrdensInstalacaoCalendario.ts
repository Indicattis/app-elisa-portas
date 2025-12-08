import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";

export interface InstalacaoCalendario {
  id: string;
  nome_cliente: string;
  data_instalacao: string | null;
  data_carregamento: string | null;
  hora: string;
  hora_carregamento: string | null;
  status: string;
  tipo_instalacao: string | null;
  responsavel_instalacao_id: string | null;
  responsavel_instalacao_nome: string | null;
  instalacao_concluida: boolean;
  instalacao_concluida_em: string | null;
  venda_id: string | null;
  venda?: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string | null;
    cliente_email: string | null;
    estado: string | null;
    cidade: string | null;
    cep: string | null;
    bairro: string | null;
  } | null;
  equipe?: {
    id: string;
    nome: string;
    cor: string | null;
  } | null;
  _corEquipe?: string | null;
}

export const useOrdensInstalacaoCalendario = (
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

  const { data: instalacoes = [], isLoading } = useQuery({
    queryKey: ["instalacoes_calendario", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
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
            bairro
          )
        `)
        .gte("data_instalacao", inicio)
        .lte("data_instalacao", fim)
        .eq("instalacao_concluida", false)
        .order("data_instalacao", { ascending: true });

      if (error) throw error;

      // Buscar cores das equipes separadamente
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);
      
      return (data || []).map(item => ({
        ...item,
        equipe: item.responsavel_instalacao_id 
          ? equipesMap.get(item.responsavel_instalacao_id) || null 
          : null,
        _corEquipe: item.responsavel_instalacao_id 
          ? equipesMap.get(item.responsavel_instalacao_id)?.cor || null 
          : null
      })) as InstalacaoCalendario[];
    },
  });

  const updateInstalacaoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InstalacaoCalendario> }) => {
      const updateData: Record<string, any> = {
        ...data,
        updated_at: new Date().toISOString()
      };

      // Sincronizar campos para compatibilidade
      if (data.data_instalacao !== undefined) {
        updateData.data_carregamento = data.data_instalacao;
      }
      if (data.hora !== undefined) {
        updateData.hora_carregamento = data.hora;
      }

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
      queryClient.invalidateQueries({ queryKey: ["instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar instalação:", error);
      toast.error("Erro ao atualizar instalação");
    },
  });

  const concluirInstalacaoMutation = useMutation({
    mutationFn: async (instalacaoId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("instalacoes")
        .update({
          instalacao_concluida: true,
          instalacao_concluida_em: new Date().toISOString(),
          instalacao_concluida_por: user.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", instalacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação concluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao concluir instalação:", error);
      toast.error("Erro ao concluir instalação");
    },
  });

  const deleteInstalacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instalacoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
      toast.success("Instalação excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar instalação:", error);
      toast.error("Erro ao excluir instalação");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('instalacoes-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instalacoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["instalacoes_calendario", inicio, fim] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inicio, fim, queryClient]);

  return {
    instalacoes,
    isLoading,
    updateInstalacao: updateInstalacaoMutation.mutateAsync,
    concluirInstalacao: concluirInstalacaoMutation.mutateAsync,
    deleteInstalacao: deleteInstalacaoMutation.mutateAsync,
    isUpdating: updateInstalacaoMutation.isPending,
    isConcluindo: concluirInstalacaoMutation.isPending,
    isDeleting: deleteInstalacaoMutation.isPending,
  };
};
