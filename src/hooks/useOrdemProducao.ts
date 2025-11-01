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
    venda?: {
      id: string;
      numero_venda: string;
    };
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
      let ordensData: any[] = [];
      const tabelaOrdem = TABELA_MAP[tipoOrdem] as any;
      
      // Buscar ordens baseado no tipo
      const { data, error } = await supabase
        .from(tabelaOrdem)
        .select(`
          *,
          linhas:linhas_ordens!ordem_id(
            id,
            item,
            quantidade,
            tamanho,
            concluida,
            concluida_em,
            concluida_por
          ),
          pedido:pedidos_producao!pedido_id(
            id,
            numero_pedido,
            cliente_nome,
            venda_id,
            venda:vendas(
              id,
              numero_venda
            )
          ),
          admin_users:responsavel_id(
            nome,
            foto_perfil_url
          )
        `)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map((ordem: any) => ({
        ...ordem,
        linhas: ordem.linhas || [],
        pedido: ordem.pedido || null,
        admin_users: ordem.admin_users || null,
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

      // Se é ordem de qualidade, avançar automaticamente após conclusão
      if (tipoOrdem === 'qualidade') {
        try {
          await moverParaProximaEtapa.mutateAsync({ pedidoId, skipCheckboxValidation: true });
          toast({
            title: "Pedido avançado automaticamente",
            description: "Inspeção de qualidade concluída. Pedido avançado para próxima etapa.",
          });
        } catch (error) {
          console.error('Erro ao avançar pedido:', error);
        }
      }
      // Nota: Para outras ordens (perfiladeira, solda, separação), 
      // não avançar automaticamente - usuário deve usar botão manual
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
