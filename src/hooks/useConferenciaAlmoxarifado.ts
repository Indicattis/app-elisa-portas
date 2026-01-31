import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProdutoAlmoxarifado {
  id: string;
  nome: string;
  quantidade_estoque: number;
  unidade: string;
}

export interface ItemConferenciaAlmox {
  id: string;
  produto_id: string;
  quantidade_anterior: number;
  quantidade_conferida: number | null;
}

export interface ConferenciaAlmox {
  id: string;
  conferido_por: string;
  status: string;
  iniciada_em: string;
  concluida_em: string | null;
  tempo_acumulado_segundos: number;
  tempo_total_segundos: number;
  pausada: boolean;
  pausada_em: string | null;
  total_itens: number;
  itens_conferidos: number;
  observacoes: string | null;
  setor: string;
  created_at: string;
}

export interface UsuarioConferencia {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
}

export interface ConferenciaAlmoxComUsuario extends ConferenciaAlmox {
  usuario: UsuarioConferencia | null;
}

export const useConferenciaAlmoxarifado = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar conferências em andamento do almoxarifado (todas, não apenas do usuário)
  const { data: conferenciasEmAndamento = [], isLoading: loadingConferencias } = useQuery({
    queryKey: ["conferencias-em-andamento-almox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_conferencias")
        .select("*")
        .eq("status", "em_andamento")
        .eq("setor", "almoxarifado")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários responsáveis
      const userIds = [...new Set(data.map(c => c.conferido_por))];
      const { data: usersData } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url")
        .in("user_id", userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || []);

      return data.map(conf => ({
        ...conf,
        usuario: usersMap.get(conf.conferido_por) || null,
      })) as ConferenciaAlmoxComUsuario[];
    },
  });

  // Buscar todos os produtos ativos do almoxarifado
  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ["almoxarifado-produtos", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("almoxarifado")
        .select("id, nome, quantidade_estoque, unidade")
        .eq("ativo", true)
        .order("nome");

      if (searchTerm) {
        query = query.ilike("nome", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProdutoAlmoxarifado[];
    },
  });

  // Buscar itens de uma conferência específica
  const buscarItensConferencia = async (conferenciaId: string) => {
    const { data, error } = await supabase
      .from("estoque_conferencia_itens")
      .select("*")
      .eq("conferencia_id", conferenciaId);

    if (error) throw error;
    return data as ItemConferenciaAlmox[];
  };

  // Iniciar nova conferência
  const iniciarConferencia = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");

      // Buscar total de itens ativos do almoxarifado
      const { count } = await supabase
        .from("almoxarifado")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      // Criar conferência com setor = 'almoxarifado'
      const { data: conferencia, error } = await supabase
        .from("estoque_conferencias")
        .insert({
          conferido_por: userData.user.id,
          status: "em_andamento",
          setor: "almoxarifado",
          iniciada_em: new Date().toISOString(),
          total_itens: count || 0,
          itens_conferidos: 0,
          tempo_acumulado_segundos: 0,
          pausada: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar todos os produtos do almoxarifado e criar itens da conferência
      const { data: produtosData } = await supabase
        .from("almoxarifado")
        .select("id, quantidade_estoque")
        .eq("ativo", true);

      if (produtosData && produtosData.length > 0) {
        const itens = produtosData.map((p) => ({
          conferencia_id: conferencia.id,
          produto_id: p.id,
          quantidade_anterior: p.quantidade_estoque,
          quantidade_conferida: null as number | null,
        }));

        const { error: itensError } = await supabase
          .from("estoque_conferencia_itens")
          .insert(itens);

        if (itensError) throw itensError;
      }

      return conferencia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conferencias-em-andamento-almox"] });
      toast({
        title: "Conferência iniciada",
        description: "A conferência do almoxarifado foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao iniciar conferência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Salvar quantidade de um item
  const salvarItemConferencia = useMutation({
    mutationFn: async ({
      conferenciaId,
      produtoId,
      quantidade,
    }: {
      conferenciaId: string;
      produtoId: string;
      quantidade: number | null;
    }) => {
      // Atualizar item
      const { error } = await supabase
        .from("estoque_conferencia_itens")
        .update({ quantidade_conferida: quantidade })
        .eq("conferencia_id", conferenciaId)
        .eq("produto_id", produtoId);

      if (error) throw error;

      // Contar itens conferidos
      const { count } = await supabase
        .from("estoque_conferencia_itens")
        .select("*", { count: "exact", head: true })
        .eq("conferencia_id", conferenciaId)
        .not("quantidade_conferida", "is", null);

      // Atualizar contador na conferência
      const { error: updateError } = await supabase
        .from("estoque_conferencias")
        .update({ itens_conferidos: count || 0 })
        .eq("id", conferenciaId);

      if (updateError) throw updateError;

      return { itensConferidos: count || 0 };
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pausar conferência
  const pausarConferencia = useMutation({
    mutationFn: async ({
      conferenciaId,
      tempoSessao,
    }: {
      conferenciaId: string;
      tempoSessao: number;
    }) => {
      // Buscar tempo acumulado atual
      const { data: conf } = await supabase
        .from("estoque_conferencias")
        .select("tempo_acumulado_segundos")
        .eq("id", conferenciaId)
        .single();

      const novoTempo = (conf?.tempo_acumulado_segundos || 0) + tempoSessao;

      const { error } = await supabase
        .from("estoque_conferencias")
        .update({
          pausada: true,
          pausada_em: new Date().toISOString(),
          tempo_acumulado_segundos: novoTempo,
        })
        .eq("id", conferenciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conferencias-em-andamento-almox"] });
      toast({
        title: "Conferência pausada",
        description: "Você pode retomar a qualquer momento.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao pausar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Retomar conferência
  const retomarConferencia = useMutation({
    mutationFn: async (conferenciaId: string) => {
      const { error } = await supabase
        .from("estoque_conferencias")
        .update({
          pausada: false,
          pausada_em: null,
        })
        .eq("id", conferenciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conferencias-em-andamento-almox"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao retomar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Concluir conferência
  const concluirConferencia = useMutation({
    mutationFn: async ({
      conferenciaId,
      tempoSessao,
      observacoes,
    }: {
      conferenciaId: string;
      tempoSessao: number;
      observacoes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");

      // Buscar conferência e itens
      const { data: conf } = await supabase
        .from("estoque_conferencias")
        .select("tempo_acumulado_segundos, total_itens, itens_conferidos")
        .eq("id", conferenciaId)
        .single();

      if (conf?.itens_conferidos !== conf?.total_itens) {
        throw new Error("Todos os itens devem ser conferidos antes de concluir");
      }

      const tempoTotal = (conf?.tempo_acumulado_segundos || 0) + tempoSessao;

      // Buscar itens da conferência
      const { data: itens } = await supabase
        .from("estoque_conferencia_itens")
        .select("produto_id, quantidade_anterior, quantidade_conferida")
        .eq("conferencia_id", conferenciaId);

      // Atualizar quantidades no almoxarifado
      for (const item of itens || []) {
        if (item.quantidade_conferida !== null) {
          const { error: updateError } = await supabase
            .from("almoxarifado")
            .update({ 
              quantidade_estoque: item.quantidade_conferida,
              data_ultima_conferencia: new Date().toISOString()
            })
            .eq("id", item.produto_id);

          if (updateError) throw updateError;
        }
      }

      // Finalizar conferência
      const { error } = await supabase
        .from("estoque_conferencias")
        .update({
          status: "concluida",
          concluida_em: new Date().toISOString(),
          tempo_total_segundos: tempoTotal,
          pausada: false,
          observacoes,
        })
        .eq("id", conferenciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conferencias-em-andamento-almox"] });
      queryClient.invalidateQueries({ queryKey: ["almoxarifado"] });
      toast({
        title: "Conferência concluída",
        description: "O almoxarifado foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao concluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Dados
    conferenciasEmAndamento,
    produtos,
    searchTerm,
    setSearchTerm,
    
    // Loading states
    loadingConferencias,
    loadingProdutos,
    
    // Funções
    buscarItensConferencia,
    iniciarConferencia: iniciarConferencia.mutateAsync,
    salvarItemConferencia: salvarItemConferencia.mutateAsync,
    pausarConferencia: pausarConferencia.mutateAsync,
    retomarConferencia: retomarConferencia.mutateAsync,
    concluirConferencia: concluirConferencia.mutateAsync,
    
    // States de mutations
    iniciando: iniciarConferencia.isPending,
    salvando: salvarItemConferencia.isPending,
    pausando: pausarConferencia.isPending,
    retomando: retomarConferencia.isPending,
    concluindo: concluirConferencia.isPending,
  };
};
