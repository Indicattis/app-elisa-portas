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
    createNeoCorrecao,
    updateNeoCorrecao,
    concluirNeoCorrecao,
    deleteNeoCorrecao
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
        .order("data_correcao", { ascending: true });

      if (correcoesError) throw correcoesError;

      // Buscar equipes para enriquecer
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      const correcoesEnriquecidas: NeoCorrecao[] = (correcoes || []).map(correcao => ({
        ...correcao,
        _tipo: 'neo_correcao' as const,
        equipe: correcao.equipe_id ? equipesMap.get(correcao.equipe_id) || null : null
      }));

      return correcoesEnriquecidas;
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["neo_correcoes_listagem"] });
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

  return {
    neoCorrecoes,
    isLoading,
    error,
    refetch,
    concluirNeoCorrecao
  };
};
