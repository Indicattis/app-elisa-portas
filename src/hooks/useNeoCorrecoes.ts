import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { useEffect } from "react";
import type { NeoCorrecao, CriarNeoCorrecaoData } from "@/types/neoCorrecao";

// Hook para o calendário de expedição
export const useNeoCorrecoes = (currentDate: Date, periodo: 'week' | 'month' = 'week') => {
  const queryClient = useQueryClient();

  // Calcular início e fim do período
  const inicio = periodo === 'week'
    ? startOfWeek(currentDate, { weekStartsOn: 1 })
    : startOfMonth(currentDate);
  const fim = periodo === 'week'
    ? endOfWeek(currentDate, { weekStartsOn: 1 })
    : endOfMonth(currentDate);

  const inicioStr = format(inicio, 'yyyy-MM-dd');
  const fimStr = format(fim, 'yyyy-MM-dd');

  // Query principal
  const { data: neoCorrecoes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["neo_correcoes_calendario", inicioStr, fimStr],
    queryFn: async () => {
      // Buscar neo correções não concluídas no período
      const { data: correcoes, error: correcoesError } = await supabase
        .from("neo_correcoes")
        .select("*")
        .eq("concluida", false)
        .neq("status", "arquivada")
        .gte("data_correcao", inicioStr)
        .lte("data_correcao", fimStr)
        .order("data_correcao", { ascending: true });

      if (correcoesError) throw correcoesError;

      // Buscar equipes para enriquecer os dados
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      // Enriquecer com dados da equipe
      const correcoesEnriquecidas: NeoCorrecao[] = (correcoes || []).map(correcao => ({
        ...correcao,
        _tipo: 'neo_correcao' as const,
        tipo_responsavel: (correcao.tipo_responsavel as 'equipe_interna' | 'autorizado' | null) || 'equipe_interna',
        equipe: correcao.equipe_id ? equipesMap.get(correcao.equipe_id) || null : null
      }));

      return correcoesEnriquecidas;
    },
  });

  // Mutation para criar
  const createNeoCorrecao = useMutation({
    mutationFn: async (dados: CriarNeoCorrecaoData) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("neo_correcoes")
        .insert({
          nome_cliente: dados.nome_cliente,
          cidade: dados.cidade,
          estado: dados.estado,
          data_correcao: dados.data_correcao,
          hora: dados.hora,
          equipe_id: dados.equipe_id,
          equipe_nome: dados.equipe_nome,
          descricao: dados.descricao || null,
          created_by: userData.user?.id || null,
          status: 'agendada'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Correção avulsa criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao criar correção:", error);
      toast.error("Erro ao criar correção avulsa");
    }
  });

  // Mutation para atualizar
  const updateNeoCorrecao = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NeoCorrecao> }) => {
      const { error } = await supabase
        .from("neo_correcoes")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar correção:", error);
      toast.error("Erro ao atualizar correção");
    }
  });

  // Mutation para concluir
  const concluirNeoCorrecao = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("neo_correcoes")
        .update({
          concluida: true,
          concluida_em: new Date().toISOString(),
          concluida_por: userData.user?.id || null,
          status: 'concluida'
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Correção concluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao concluir correção:", error);
      toast.error("Erro ao concluir correção");
    }
  });

  // Mutation para deletar
  const deleteNeoCorrecao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("neo_correcoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Correção removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao remover correção:", error);
      toast.error("Erro ao remover correção");
    }
  });

  // Subscription realtime
  useEffect(() => {
    const channel = supabase
      .channel('neo_correcoes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_correcoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_correcoes_calendario", inicioStr, fimStr] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, inicioStr, fimStr]);

  return {
    neoCorrecoes,
    isLoading,
    error,
    refetch,
    createNeoCorrecao: createNeoCorrecao.mutateAsync,
    updateNeoCorrecao: updateNeoCorrecao.mutateAsync,
    concluirNeoCorrecao: concluirNeoCorrecao.mutateAsync,
    deleteNeoCorrecao: deleteNeoCorrecao.mutateAsync,
    isCreating: createNeoCorrecao.isPending,
    isUpdating: updateNeoCorrecao.isPending,
    isConcluindo: concluirNeoCorrecao.isPending,
    isDeleting: deleteNeoCorrecao.isPending,
  };
};

// Hook para listagem (gestão de fábrica)
export const useNeoCorrecoesListagem = () => {
  const queryClient = useQueryClient();

  const { data: neoCorrecoes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["neo_correcoes_listagem"],
    queryFn: async () => {
      const { data: correcoes, error: correcoesError } = await supabase
        .from("neo_correcoes")
        .select("*")
        .eq("concluida", false)
        .neq("status", "arquivada")
        .order("prioridade_gestao", { ascending: false })
        .order("data_correcao", { ascending: true });

      if (correcoesError) throw correcoesError;

      // Buscar equipes para enriquecer
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      // Buscar dados dos criadores
      const createdByIds = [...new Set((correcoes || []).map(item => item.created_by).filter(Boolean))];
      const { data: usuarios } = createdByIds.length > 0 
        ? await supabase
            .from("admin_users")
            .select("user_id, nome, foto_perfil_url")
            .in("user_id", createdByIds)
        : { data: [] };

      const usuariosMap = new Map((usuarios || []).map(u => [u.user_id, u]));

      const correcoesEnriquecidas: NeoCorrecao[] = (correcoes || []).map(correcao => ({
        ...correcao,
        _tipo: 'neo_correcao' as const,
        tipo_responsavel: (correcao.tipo_responsavel as 'equipe_interna' | 'autorizado' | null) || 'equipe_interna',
        equipe: correcao.equipe_id ? equipesMap.get(correcao.equipe_id) || null : null,
        criador: correcao.created_by
          ? usuariosMap.get(correcao.created_by)
            ? {
                id: usuariosMap.get(correcao.created_by)!.user_id,
                nome: usuariosMap.get(correcao.created_by)!.nome,
                foto_perfil_url: usuariosMap.get(correcao.created_by)!.foto_perfil_url
              }
            : null
          : null
      }));

      // Ordenar por status de agendamento
      return correcoesEnriquecidas.sort((a, b) => {
        const getGrupo = (p: NeoCorrecao) => {
          if (!p.data_correcao) return 0; // Não agendado
          const hoje = new Date().toISOString().split('T')[0];
          if (p.data_correcao < hoje) return 1; // Atrasado
          return 2; // Agendado
        };
        const grupoA = getGrupo(a);
        const grupoB = getGrupo(b);
        if (grupoA !== grupoB) return grupoA - grupoB;
        const dataA = a.data_correcao || '9999-12-31';
        const dataB = b.data_correcao || '9999-12-31';
        return dataA.localeCompare(dataB);
      });
    },
  });

  const concluirNeoCorrecao = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();

      // Check if already concluded - if so, archive it
      const { data: existing } = await supabase
        .from("neo_correcoes")
        .select("concluida")
        .eq("id", id)
        .single();

      if (existing?.concluida) {
        // Already concluded - archive to remove from finalizadas list
        const { error } = await supabase
          .from("neo_correcoes")
          .update({
            status: 'arquivada',
            concluida: false,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("neo_correcoes")
          .update({
            concluida: true,
            concluida_em: new Date().toISOString(),
            concluida_por: userData.user?.id || null,
            status: 'concluida',
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Correção concluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_finalizadas"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
    },
    onError: (error) => {
      console.error("Erro ao concluir correção:", error);
      toast.error("Erro ao concluir correção");
    }
  });

  // Subscription realtime
  useEffect(() => {
    const channel = supabase
      .channel('neo_correcoes_listagem_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_correcoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
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
          .from("neo_correcoes")
          .update({ prioridade_gestao: update.prioridade_gestao })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao reorganizar neo correções:", error);
      toast.error("Erro ao reorganizar");
    },
  });

  return {
    neoCorrecoes,
    isLoading,
    error,
    refetch,
    concluirNeoCorrecao,
    reorganizarNeoCorrecoes: reorganizarMutation.mutate,
  };
};

// Hook para buscar Neo Correções FINALIZADAS
export const useNeoCorrecoesFinalizadas = () => {
  const queryClient = useQueryClient();

  const { data: neoCorrecoesFinalizadas = [], isLoading } = useQuery({
    queryKey: ["neo_correcoes_finalizadas"],
    queryFn: async () => {
      // Buscar neo correções finalizadas (últimos 30 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const { data, error } = await supabase
        .from("neo_correcoes")
        .select("*")
        .eq("concluida", true)
        .neq("status", "aguardando_cliente")
        .neq("status", "arquivada")
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
        _tipo: 'neo_correcao' as const,
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
      })) as (NeoCorrecao & { concluidor?: { id: string; nome: string; foto_perfil_url: string | null } | null })[];
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('neo-correcoes-finalizadas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_correcoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_correcoes_finalizadas"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const retornarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("neo_correcoes")
        .update({
          concluida: false,
          concluida_em: null,
          concluida_por: null,
          status: 'pendente',
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_finalizadas"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
      toast.success("Neo correção retornada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao retornar neo correção:", error);
      toast.error("Erro ao retornar neo correção");
    },
  });

  const arquivarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("neo_correcoes")
        .update({
          status: 'arquivada',
          concluida: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_finalizadas"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos_contadores"] });
      toast.success("Neo correção arquivada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao arquivar neo correção:", error);
      toast.error("Erro ao arquivar neo correção");
    },
  });

  const enviarAguardandoClienteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("neo_correcoes")
        .update({
          status: 'aguardando_cliente',
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_finalizadas"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_aguardando_cliente"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos-contadores"] });
      toast.success("Enviado para Aguardando Cliente!");
    },
    onError: (error) => {
      console.error("Erro ao enviar para Aguardando Cliente:", error);
      toast.error("Erro ao enviar para Aguardando Cliente");
    },
  });

  return {
    neoCorrecoesFinalizadas,
    isLoading,
    retornarNeoCorrecao: retornarMutation.mutateAsync,
    isRetornando: retornarMutation.isPending,
    arquivarNeoCorrecao: arquivarMutation.mutateAsync,
    isArquivando: arquivarMutation.isPending,
    enviarAguardandoClienteNeoCorrecao: enviarAguardandoClienteMutation.mutateAsync,
    isEnviandoAguardandoCliente: enviarAguardandoClienteMutation.isPending,
  };
};

// Hook para buscar Neo Correções SEM DATA (pendentes de agendamento)
export const useNeoCorrecoesSemData = () => {
  const queryClient = useQueryClient();

  const { data: neoCorrecoesSemData = [], isLoading } = useQuery({
    queryKey: ["neo_correcoes_sem_data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neo_correcoes")
        .select("*")
        .is("data_correcao", null)
        .eq("concluida", false)
        .neq("status", "arquivada")
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
        _tipo: 'neo_correcao' as const,
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
      })) as NeoCorrecao[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NeoCorrecao> }) => {
      const { data: updated, error } = await supabase
        .from("neo_correcoes")
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
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_sem_data"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_calendario"] });
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar neo correção:", error);
      toast.error("Erro ao atualizar neo correção");
    },
  });

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('neo-correcoes-sem-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neo_correcoes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neo_correcoes_sem_data"] });
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
          .from("neo_correcoes")
          .update({ prioridade_gestao: update.prioridade_gestao, updated_at: new Date().toISOString() })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_sem_data"] });
    },
    onError: (error) => {
      console.error("Erro ao reorganizar neo correções:", error);
      toast.error("Erro ao reorganizar");
    },
  });

  return {
    neoCorrecoesSemData,
    isLoading,
    updateNeoCorrecao: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    reorganizarNeoCorrecoes: reorganizarMutation.mutate,
  };
};
