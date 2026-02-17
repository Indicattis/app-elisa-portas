import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useEffect } from "react";
import { NeoInstalacao, CriarNeoInstalacaoData } from "@/types/neoInstalacao";

export const useNeoInstalacoes = (
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

  const { data: neoInstalacoes = [], isLoading } = useQuery({
    queryKey: ["neo_instalacoes_calendario", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neo_instalacoes")
        .select("*")
        .gte("data_instalacao", inicio)
        .lte("data_instalacao", fim)
        .eq("concluida", false)
        .order("data_instalacao", { ascending: true });

      if (error) throw error;

      // Buscar cores das equipes
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);
      
      return (data || []).map(item => ({
        ...item,
        _tipo: 'neo_instalacao' as const,
        tipo_responsavel: (item.tipo_responsavel as 'equipe_interna' | 'autorizado' | null) || 'equipe_interna',
        equipe: item.equipe_id 
          ? equipesMap.get(item.equipe_id) || null 
          : null
      })) as NeoInstalacao[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dados: CriarNeoInstalacaoData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("neo_instalacoes")
        .insert({
          ...dados,
          status: 'agendada',
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
      toast.success("Neo instalação criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar neo instalação:", error);
      toast.error("Erro ao criar neo instalação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NeoInstalacao> }) => {
      const { data: updated, error } = await supabase
        .from("neo_instalacoes")
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
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar neo instalação:", error);
      toast.error("Erro ao atualizar neo instalação");
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("neo_instalacoes")
        .update({
          concluida: true,
          concluida_em: new Date().toISOString(),
          concluida_por: user.user?.id,
          status: 'concluida',
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
      toast.success("Neo instalação concluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao concluir neo instalação:", error);
      toast.error("Erro ao concluir neo instalação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("neo_instalacoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
      toast.success("Neo instalação excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar neo instalação:", error);
      toast.error("Erro ao excluir neo instalação");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('neo-instalacoes-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_instalacoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_calendario", inicio, fim] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inicio, fim, queryClient]);

  return {
    neoInstalacoes,
    isLoading,
    createNeoInstalacao: createMutation.mutateAsync,
    updateNeoInstalacao: updateMutation.mutateAsync,
    concluirNeoInstalacao: concluirMutation.mutateAsync,
    deleteNeoInstalacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isConcluindo: concluirMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// Hook para listagem geral (usado na gestão de fábrica)
export const useNeoInstalacoesListagem = () => {
  const queryClient = useQueryClient();

  const { data: neoInstalacoes = [], isLoading } = useQuery({
    queryKey: ["neo_instalacoes_listagem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neo_instalacoes")
        .select("*")
        .eq("concluida", false)
        .order("prioridade_gestao", { ascending: false })
        .order("data_instalacao", { ascending: true });

      if (error) throw error;

      // Buscar cores das equipes
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      // Buscar dados dos criadores
      const createdByIds = [...new Set((data || []).map(item => item.created_by).filter(Boolean))];
      const { data: usuarios } = createdByIds.length > 0 
        ? await supabase
            .from("admin_users")
            .select("user_id, nome, foto_perfil_url")
            .in("user_id", createdByIds)
        : { data: [] };

      const usuariosMap = new Map((usuarios || []).map(u => [u.user_id, u]));
      
      return (data || []).map(item => ({
        ...item,
        _tipo: 'neo_instalacao' as const,
        tipo_responsavel: (item.tipo_responsavel as 'equipe_interna' | 'autorizado' | null) || 'equipe_interna',
        equipe: item.equipe_id 
          ? equipesMap.get(item.equipe_id) || null 
          : null,
        criador: item.created_by
          ? usuariosMap.get(item.created_by) 
            ? {
                id: usuariosMap.get(item.created_by)!.user_id,
                nome: usuariosMap.get(item.created_by)!.nome,
                foto_perfil_url: usuariosMap.get(item.created_by)!.foto_perfil_url
              }
            : null
          : null
      })) as NeoInstalacao[];
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: user } = await supabase.auth.getUser();

      // Check if already concluded - if so, archive it
      const { data: existing } = await supabase
        .from("neo_instalacoes")
        .select("concluida")
        .eq("id", id)
        .single();

      if (existing?.concluida) {
        // Already concluded - archive to remove from finalizadas list
        const { error } = await supabase
          .from("neo_instalacoes")
          .update({
            status: 'arquivada',
            concluida: false,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("neo_instalacoes")
          .update({
            concluida: true,
            concluida_em: new Date().toISOString(),
            concluida_por: user.user?.id,
            status: 'concluida',
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_finalizadas"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
      toast.success("Neo instalação concluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao concluir neo instalação:", error);
      toast.error("Erro ao concluir neo instalação");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('neo-instalacoes-listagem-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_instalacoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
          queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const reorganizarMutation = useMutation({
    mutationFn: async (updates: { id: string; prioridade_gestao: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("neo_instalacoes")
          .update({ prioridade_gestao: update.prioridade_gestao })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao reorganizar neo instalações:", error);
      toast.error("Erro ao reorganizar");
    },
  });

  return {
    neoInstalacoes,
    isLoading,
    concluirNeoInstalacao: concluirMutation.mutateAsync,
    isConcluindo: concluirMutation.isPending,
    reorganizarNeoInstalacoes: reorganizarMutation.mutate,
  };
};

// Hook para buscar Neo Instalações FINALIZADAS
export const useNeoInstalacoesFinalizadas = () => {
  const queryClient = useQueryClient();

  const { data: neoInstalacoesFinalizadas = [], isLoading } = useQuery({
    queryKey: ["neo_instalacoes_finalizadas"],
    queryFn: async () => {
      // Buscar neo instalações finalizadas (últimos 30 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const { data, error } = await supabase
        .from("neo_instalacoes")
        .select("*")
        .eq("concluida", true)
        .gte("concluida_em", dataLimite.toISOString())
        .order("concluida_em", { ascending: false });

      if (error) throw error;

      // Buscar dados das equipes
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      // Buscar dados dos usuários que concluíram
      const concluidoPorIds = [...new Set((data || []).map(item => item.concluida_por).filter(Boolean))];
      const { data: usuarios } = concluidoPorIds.length > 0
        ? await supabase
            .from("admin_users")
            .select("user_id, nome, foto_perfil_url")
            .in("user_id", concluidoPorIds)
        : { data: [] };

      const usuariosMap = new Map((usuarios || []).map(u => [u.user_id, u]));

      return (data || []).map(item => ({
        ...item,
        _tipo: 'neo_instalacao' as const,
        tipo_responsavel: (item.tipo_responsavel as 'equipe_interna' | 'autorizado' | null) || 'equipe_interna',
        equipe: item.equipe_id
          ? equipesMap.get(item.equipe_id) || null
          : null,
        concluidor: item.concluida_por
          ? usuariosMap.get(item.concluida_por)
            ? {
                id: usuariosMap.get(item.concluida_por)!.user_id,
                nome: usuariosMap.get(item.concluida_por)!.nome,
                foto_perfil_url: usuariosMap.get(item.concluida_por)!.foto_perfil_url
              }
            : null
          : null
      })) as (NeoInstalacao & { concluidor?: { id: string; nome: string; foto_perfil_url: string | null } | null })[];
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('neo-instalacoes-finalizadas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_instalacoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_finalizadas"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const retornarMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Buscar dados da neo instalação
      const { data: instalacao, error: fetchError } = await supabase
        .from("neo_instalacoes")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !instalacao) throw fetchError || new Error("Instalação não encontrada");

      // 2. Criar nova neo correção com os dados copiados
      const { error: insertError } = await supabase
        .from("neo_correcoes")
        .insert({
          nome_cliente: instalacao.nome_cliente,
          cidade: instalacao.cidade,
          estado: instalacao.estado,
          descricao: instalacao.descricao,
          equipe_id: instalacao.equipe_id,
          equipe_nome: instalacao.equipe_nome,
          tipo_responsavel: instalacao.tipo_responsavel,
          autorizado_id: instalacao.autorizado_id,
          autorizado_nome: instalacao.autorizado_nome,
          valor_total: instalacao.valor_total,
          valor_a_receber: instalacao.valor_a_receber,
          etapa_causadora: instalacao.etapa_causadora,
          status: 'pendente',
          created_by: instalacao.created_by,
        });

      if (insertError) throw insertError;

      // 3. Arquivar a neo instalação original
      const { error: archiveError } = await supabase
        .from("neo_instalacoes")
        .update({
          status: 'arquivada',
          concluida: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (archiveError) throw archiveError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_finalizadas"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
      toast.success("Enviado para correções com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao enviar para correções:", error);
      toast.error("Erro ao enviar para correções");
    },
  });

  return {
    neoInstalacoesFinalizadas,
    isLoading,
    retornarNeoInstalacao: retornarMutation.mutateAsync,
    isRetornando: retornarMutation.isPending,
  };
};

// Hook para buscar Neo Instalações SEM DATA (pendentes de agendamento)
export const useNeoInstalacoesSemData = () => {
  const queryClient = useQueryClient();

  const { data: neoInstalacoesSemData = [], isLoading } = useQuery({
    queryKey: ["neo_instalacoes_sem_data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neo_instalacoes")
        .select("*")
        .is("data_instalacao", null)
        .eq("concluida", false)
        .order("prioridade_gestao", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar cores das equipes
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      // Buscar dados dos criadores
      const createdByIds = [...new Set((data || []).map(item => item.created_by).filter(Boolean))];
      const { data: usuarios } = createdByIds.length > 0 
        ? await supabase
            .from("admin_users")
            .select("user_id, nome, foto_perfil_url")
            .in("user_id", createdByIds)
        : { data: [] };

      const usuariosMap = new Map((usuarios || []).map(u => [u.user_id, u]));
      
      return (data || []).map(item => ({
        ...item,
        _tipo: 'neo_instalacao' as const,
        tipo_responsavel: (item.tipo_responsavel as 'equipe_interna' | 'autorizado' | null) || 'equipe_interna',
        equipe: item.equipe_id 
          ? equipesMap.get(item.equipe_id) || null 
          : null,
        criador: item.created_by
          ? usuariosMap.get(item.created_by)
            ? {
                id: usuariosMap.get(item.created_by)!.user_id,
                nome: usuariosMap.get(item.created_by)!.nome,
                foto_perfil_url: usuariosMap.get(item.created_by)!.foto_perfil_url
              }
            : null
          : null
      })) as NeoInstalacao[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NeoInstalacao> }) => {
      const { data: updated, error } = await supabase
        .from("neo_instalacoes")
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
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_sem_data"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar neo instalação:", error);
      toast.error("Erro ao atualizar neo instalação");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('neo-instalacoes-sem-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_instalacoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_sem_data"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const reorganizarMutation = useMutation({
    mutationFn: async (updates: { id: string; prioridade_gestao: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("neo_instalacoes")
          .update({ prioridade_gestao: update.prioridade_gestao, updated_at: new Date().toISOString() })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_sem_data"] });
    },
    onError: (error) => {
      console.error("Erro ao reorganizar neo instalações:", error);
      toast.error("Erro ao reorganizar");
    },
  });

  return {
    neoInstalacoesSemData,
    isLoading,
    updateNeoInstalacao: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    reorganizarNeoInstalacoes: reorganizarMutation.mutate,
  };
};
