import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePedidosEtapas } from "./usePedidosEtapas";

export interface PedidoAprovacao {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  valor_venda: number | null;
  data_entrega: string | null;
  created_at: string;
  produtos_resumo: string;
  checkboxes: Array<{
    id: string;
    label: string;
    checked: boolean;
    required: boolean;
  }>;
}

export function usePedidosAprovacaoCEO() {
  const queryClient = useQueryClient();
  const { moverParaProximaEtapa } = usePedidosEtapas('aprovacao_ceo');

  // Buscar pedidos na etapa aprovacao_ceo
  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ['pedidos-aprovacao-ceo'],
    queryFn: async () => {
      // Buscar pedidos em aprovação CEO
      const { data: pedidosData, error } = await supabase
        .from('pedidos_producao')
        .select(`
          id,
          numero_pedido,
          created_at,
          data_entrega,
          vendas:venda_id (
            cliente_nome,
            valor_venda,
            produtos_vendas (
              tipo_produto,
              quantidade
            )
          ),
          pedidos_etapas!inner (
            checkboxes
          )
        `)
        .eq('etapa_atual', 'aprovacao_ceo')
        .eq('arquivado', false)
        .is('pedidos_etapas.data_saida', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!pedidosData) return [];

      return pedidosData.map((pedido: any) => {
        const venda = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
        const produtos = venda?.produtos_vendas || [];
        
        // Construir resumo de produtos
        const contagem: Record<string, number> = {};
        produtos.forEach((p: any) => {
          const tipo = p.tipo_produto === 'porta_enrolar' ? 'Porta de Enrolar' : 
                       p.tipo_produto === 'motor' ? 'Motor' :
                       p.tipo_produto === 'acessorio' ? 'Acessório' : p.tipo_produto;
          contagem[tipo] = (contagem[tipo] || 0) + (p.quantidade || 1);
        });
        
        const resumo = Object.entries(contagem)
          .map(([tipo, qtd]) => `${qtd} ${tipo}${qtd > 1 ? 's' : ''}`)
          .join(', ') || 'Sem produtos';

        // Checkboxes da etapa atual
        const etapaAtual = pedido.pedidos_etapas?.[0];
        const checkboxes = etapaAtual?.checkboxes || [
          { id: 'revisado_diretoria', label: 'Pedido revisado pela diretoria', checked: false, required: true },
          { id: 'aprovado_producao', label: 'Aprovado para produção', checked: false, required: true }
        ];

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          cliente_nome: venda?.cliente_nome || 'Cliente não informado',
          valor_venda: venda?.valor_venda || null,
          data_entrega: pedido.data_entrega,
          created_at: pedido.created_at,
          produtos_resumo: resumo,
          checkboxes: checkboxes as any[]
        } as PedidoAprovacao;
      });
    },
    refetchInterval: 10000,
  });

  // Atualizar checkbox de um pedido
  const atualizarCheckbox = useMutation({
    mutationFn: async ({ 
      pedidoId, 
      checkboxId, 
      checked 
    }: { 
      pedidoId: string; 
      checkboxId: string; 
      checked: boolean;
    }) => {
      // Buscar etapa atual
      const { data: etapaAtual, error: etapaError } = await supabase
        .from('pedidos_etapas')
        .select('id, checkboxes')
        .eq('pedido_id', pedidoId)
        .eq('etapa', 'aprovacao_ceo')
        .is('data_saida', null)
        .single();

      if (etapaError) throw etapaError;

      const checkboxes = (etapaAtual.checkboxes as any[]) || [];
      const updatedCheckboxes = checkboxes.map(cb =>
        cb.id === checkboxId
          ? { ...cb, checked, checked_at: checked ? new Date().toISOString() : undefined }
          : cb
      );

      const { error } = await supabase
        .from('pedidos_etapas')
        .update({ checkboxes: updatedCheckboxes })
        .eq('id', etapaAtual.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-aprovacao-ceo'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  // Aprovar pedido e avançar para produção
  const aprovarPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      // Primeiro, garantir que todos os checkboxes estão marcados
      const { data: etapaAtual, error: etapaError } = await supabase
        .from('pedidos_etapas')
        .select('id, checkboxes')
        .eq('pedido_id', pedidoId)
        .eq('etapa', 'aprovacao_ceo')
        .is('data_saida', null)
        .single();

      if (etapaError) throw etapaError;

      const checkboxes = (etapaAtual.checkboxes as any[]) || [];
      const todosObrigatoriosMarcados = checkboxes
        .filter(cb => cb.required)
        .every(cb => cb.checked);

      if (!todosObrigatoriosMarcados) {
        throw new Error('Marque todos os itens obrigatórios antes de aprovar');
      }

      // Avançar para próxima etapa usando o hook existente
      await moverParaProximaEtapa.mutateAsync({ pedidoId });
    },
    onSuccess: () => {
      toast.success('Pedido aprovado e enviado para produção!');
      queryClient.invalidateQueries({ queryKey: ['pedidos-aprovacao-ceo'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    },
    onError: (error) => {
      toast.error('Erro ao aprovar: ' + error.message);
    }
  });

  return {
    pedidos,
    isLoading,
    refetch,
    atualizarCheckbox,
    aprovarPedido
  };
}
