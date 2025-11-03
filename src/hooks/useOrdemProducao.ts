import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas } from "./usePedidosEtapas";
import { useEffect } from "react";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  concluida: boolean;
  concluida_em?: string;
  concluida_por?: string;
}

interface Ordem {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  data_conclusao?: string;
  observacoes?: string;
  responsavel_id?: string;
  linhas?: LinhaOrdem[];
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    venda_id?: string;
  };
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

const TABELA_MAP: Record<TipoOrdem, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
  qualidade: 'ordens_qualidade',
};

export function useOrdemProducao(tipoOrdem: TipoOrdem) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { moverParaProximaEtapa } = usePedidosEtapas();

  // Buscar todas as ordens do tipo
  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ['ordens-producao', tipoOrdem],
    queryFn: async () => {
      const tabelaOrdem = TABELA_MAP[tipoOrdem] as any;
      
      // Buscar ordens baseado no tipo
      const { data: ordensData, error: ordensError } = await supabase
        .from(tabelaOrdem)
        .select(`
          *,
          pedido:pedidos_producao!pedido_id(
            id,
            numero_pedido,
            cliente_nome,
            venda_id
          )
        `)
        .order('created_at', { ascending: true });
      
      if (ordensError) throw ordensError;
      if (!ordensData || ordensData.length === 0) return [];
      
      // Buscar linhas para todas as ordens de uma vez
      const ordemIds = ordensData.map((o: any) => o.id);
      const { data: linhasData, error: linhasError } = await supabase
        .from('linhas_ordens')
        .select('*')
        .in('ordem_id', ordemIds)
        .eq('tipo_ordem', tipoOrdem);
      
      if (linhasError) throw linhasError;
      
      // Buscar dados dos responsáveis se houver
      const responsavelIds = ordensData
        .map((o: any) => o.responsavel_id)
        .filter((id: string | null) => id !== null);
      
      let responsaveisMap: Record<string, any> = {};
      if (responsavelIds.length > 0) {
        const { data: responsaveis } = await supabase
          .from('admin_users')
          .select('user_id, nome, foto_perfil_url')
          .in('user_id', responsavelIds);
        
        if (responsaveis) {
          responsaveisMap = responsaveis.reduce((acc, r) => {
            acc[r.user_id] = r;
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      // Mapear linhas para suas ordens
      return ordensData.map((ordem: any) => ({
        ...ordem,
        linhas: (linhasData || []).filter((linha: any) => linha.ordem_id === ordem.id),
        pedido: ordem.pedido || null,
        admin_users: ordem.responsavel_id ? responsaveisMap[ordem.responsavel_id] || null : null,
      })) as Ordem[];
    },
  });

  // Subscribe to realtime updates for linhas_ordens
  useEffect(() => {
    const channel = supabase
      .channel('linhas-ordens-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'linhas_ordens',
          filter: `tipo_ordem=eq.${tipoOrdem}`
        },
        () => {
          // Invalidate queries on any update to refresh data
          queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tipoOrdem, queryClient]);

  // Capturar ordem (atribuir responsável)
  const capturarOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const tabelaOrdem = TABELA_MAP[tipoOrdem] as any;
      
      const { error } = await supabase
        .from(tabelaOrdem)
        .update({
          responsavel_id: user.id,
        })
        .eq('id', ordemId);

      if (error) throw error;
      return ordemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
      toast({
        title: "Ordem capturada",
        description: "Você agora é o responsável por esta ordem.",
      });
    },
    onError: (error) => {
      console.error('Erro ao capturar ordem:', error);
      toast({
        title: "Erro ao capturar",
        description: "Não foi possível capturar a ordem.",
        variant: "destructive",
      });
    },
  });

  // Marcar linha como concluída com atualização otimista
  const marcarLinhaConcluida = useMutation({
    mutationFn: async ({ linhaId, concluida }: { linhaId: string; concluida: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('linhas_ordens')
        .update({
          concluida,
          concluida_em: concluida ? new Date().toISOString() : null,
          concluida_por: concluida ? user?.id : null,
        })
        .eq('id', linhaId);

      if (error) throw error;
      return { linhaId, concluida };
    },
    onMutate: async ({ linhaId, concluida }) => {
      // Cancel queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['ordens-producao', tipoOrdem] });

      // Snapshot for rollback
      const previousOrdens = queryClient.getQueryData<Ordem[]>(['ordens-producao', tipoOrdem]);

      // Optimistic update: immediately update the cache
      queryClient.setQueryData<Ordem[]>(['ordens-producao', tipoOrdem], (oldData) => {
        if (!oldData) return oldData;
        
        // Create new array with updated linha
        return oldData.map(ordem => ({
          ...ordem,
          linhas: ordem.linhas?.map(linha => 
            linha.id === linhaId
              ? { ...linha, concluida }
              : linha
          ) || []
        }));
      });

      return { previousOrdens };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousOrdens) {
        queryClient.setQueryData(['ordens-producao', tipoOrdem], context.previousOrdens);
      }
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a linha.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Buscar pedidoId da linha para invalidar a query de status
      const ordemComLinha = ordens.find(o => 
        o.linhas?.some(l => l.id === variables.linhaId)
      );
      
      if (ordemComLinha?.pedido_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['pedido-ordens-status', ordemComLinha.pedido_id] 
        });
        // Invalidar também status de qualidade se for ordem de qualidade
        if (tipoOrdem === 'qualidade') {
          queryClient.invalidateQueries({ 
            queryKey: ['pedido-qualidade-status', ordemComLinha.pedido_id] 
          });
        }
      }
      
      toast({
        title: "Atualizado",
      });
    },
  });

  // Concluir ordem
  const concluirOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      let pedidoId: string | null = null;

      // Buscar e atualizar baseado no tipo
      if (tipoOrdem === 'soldagem') {
        const { data: ordem, error: ordemError } = await supabase
          .from('ordens_soldagem')
          .select('pedido_id')
          .eq('id', ordemId)
          .single();
        if (ordemError) throw ordemError;
        pedidoId = ordem.pedido_id;

        const { error } = await supabase
          .from('ordens_soldagem')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', ordemId);
        if (error) throw error;
      } else if (tipoOrdem === 'perfiladeira') {
        const { data: ordem, error: ordemError } = await supabase
          .from('ordens_perfiladeira')
          .select('pedido_id')
          .eq('id', ordemId)
          .single();
        if (ordemError) throw ordemError;
        pedidoId = ordem.pedido_id;

        const { error } = await supabase
          .from('ordens_perfiladeira')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', ordemId);
        if (error) throw error;
      } else if (tipoOrdem === 'separacao') {
        const { data: ordem, error: ordemError } = await supabase
          .from('ordens_separacao')
          .select('pedido_id')
          .eq('id', ordemId)
          .single();
        if (ordemError) throw ordemError;
        pedidoId = ordem.pedido_id;

        const { error } = await supabase
          .from('ordens_separacao')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', ordemId);
        if (error) throw error;
      } else if (tipoOrdem === 'qualidade') {
        const { data: ordem, error: ordemError } = await supabase
          .from('ordens_qualidade')
          .select('pedido_id')
          .eq('id', ordemId)
          .single();
        if (ordemError) throw ordemError;
        pedidoId = ordem.pedido_id;

        const { error } = await supabase
          .from('ordens_qualidade')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', ordemId);
        if (error) throw error;
      }

      if (!pedidoId) throw new Error('Pedido ID não encontrado');
      return pedidoId;
    },
    onSuccess: async (pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
      queryClient.invalidateQueries({ queryKey: ['pedido-ordens-status', pedidoId] });
      
      // Invalidar também status de qualidade se for ordem de qualidade
      if (tipoOrdem === 'qualidade') {
        queryClient.invalidateQueries({ 
          queryKey: ['pedido-qualidade-status', pedidoId] 
        });
      }
      
      toast({
        title: "Ordem concluída",
        description: "A ordem foi concluída com sucesso.",
      });

      // Nota: Pedido não avança automaticamente - usuário deve usar botão manual para avançar
    },
    onError: (error) => {
      console.error('Erro ao concluir ordem:', error);
      toast({
        title: "Erro ao concluir",
        description: "Não foi possível concluir a ordem.",
        variant: "destructive",
      });
    },
  });

  // Separar ordens por status
  const ordensAFazer = ordens.filter(o => o.status === 'pendente');
  const ordensConcluidas = ordens.filter(o => o.status === 'concluido');

  return {
    ordens,
    ordensAFazer,
    ordensConcluidas,
    isLoading,
    capturarOrdem,
    marcarLinhaConcluida,
    concluirOrdem,
  };
}
