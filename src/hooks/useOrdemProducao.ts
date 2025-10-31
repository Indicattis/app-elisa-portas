import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePedidosEtapas } from "./usePedidosEtapas";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao';

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
    cliente_nome: string;
  };
}

const TABELA_MAP: Record<TipoOrdem, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
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
      
      // Buscar ordens baseado no tipo
      if (tipoOrdem === 'soldagem') {
        const { data, error } = await supabase
          .from('ordens_soldagem')
          .select('*, pedidos_producao(cliente_nome)')
          .order('created_at', { ascending: true });
        if (error) throw error;
        ordensData = data || [];
      } else if (tipoOrdem === 'perfiladeira') {
        const { data, error } = await supabase
          .from('ordens_perfiladeira')
          .select('*, pedidos_producao(cliente_nome)')
          .order('created_at', { ascending: true });
        if (error) throw error;
        ordensData = data || [];
      } else if (tipoOrdem === 'separacao') {
        const { data, error } = await supabase
          .from('ordens_separacao')
          .select('*, pedidos_producao(cliente_nome)')
          .order('created_at', { ascending: true });
        if (error) throw error;
        ordensData = data || [];
      }

      // Buscar linhas de cada ordem
      const ordensComLinhas = await Promise.all(
        ordensData.map(async (ordem: any) => {
          const { data: linhas } = await supabase
            .from('linhas_ordens')
            .select('*')
            .eq('pedido_id', ordem.pedido_id)
            .eq('tipo_ordem', tipoOrdem)
            .order('created_at', { ascending: true });

          return {
            ...ordem,
            linhas: linhas || [],
            pedido: Array.isArray(ordem.pedidos_producao) 
              ? ordem.pedidos_producao[0] 
              : ordem.pedidos_producao,
          } as Ordem;
        })
      );

      return ordensComLinhas;
    },
    refetchInterval: 5000,
  });

  // Marcar linha como concluída
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
      toast({
        title: "Linha atualizada",
        description: "Status da linha foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar linha:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a linha.",
        variant: "destructive",
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
      }

      if (!pedidoId) throw new Error('Pedido ID não encontrado');
      return pedidoId;
    },
    onSuccess: async (pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-producao', tipoOrdem] });
      
      toast({
        title: "Ordem concluída",
        description: "A ordem foi concluída com sucesso.",
      });

      // Verificar se todas as ordens do pedido estão concluídas
      const { data: todasConcluidas } = await supabase
        .rpc('verificar_ordens_pedido_concluidas', { p_pedido_id: pedidoId });

      if (todasConcluidas) {
        // Avançar pedido automaticamente
        try {
          await moverParaProximaEtapa.mutateAsync(pedidoId);
          toast({
            title: "Pedido avançado automaticamente",
            description: "Todas as ordens foram concluídas. O pedido foi movido para Inspeção da Qualidade.",
          });
        } catch (error) {
          console.error('Erro ao avançar pedido:', error);
        }
      }
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
    marcarLinhaConcluida,
    concluirOrdem,
  };
}
