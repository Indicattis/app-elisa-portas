import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EtapaPedido, PedidoEtapa, PedidoCheckbox } from "@/types/pedidoEtapa";
import { ETAPAS_CONFIG, getProximaEtapa } from "@/types/pedidoEtapa";

export function usePedidosEtapas(etapa?: EtapaPedido) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar pedidos por etapa
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-etapas', etapa],
    queryFn: async () => {
      let query = supabase
        .from('pedidos_producao')
        .select(`
          *,
          vendas:venda_id (
            id,
            cliente_nome,
            cliente_telefone,
            valor_venda,
            created_at,
            produtos_vendas (
              id,
              tipo_produto,
              cor:catalogo_cores (nome)
            )
          ),
          pedidos_etapas (*)
        `)
        .order('created_at', { ascending: false });

      if (etapa) {
        if (etapa === 'aberto') {
          // Vendas sem pedido de produção
          const { data: vendasSemPedido } = await supabase
            .from('vendas')
            .select(`
              *,
              produtos_vendas (
                id,
                tipo_produto,
                cor:catalogo_cores (nome)
              )
            `)
            .is('pedido_producao_id', null)
            .order('created_at', { ascending: false });

          return vendasSemPedido || [];
        } else {
          query = query.eq('etapa_atual', etapa);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar etapa atual de um pedido
  const getEtapaAtual = async (pedidoId: string): Promise<PedidoEtapa | null> => {
    const { data, error } = await supabase
      .from('pedidos_etapas')
      .select('*')
      .eq('pedido_id', pedidoId)
      .is('data_saida', null)
      .single();

    if (error) return null;
    return {
      ...data,
      checkboxes: (data.checkboxes as any) || []
    } as PedidoEtapa;
  };

  // Criar pedido de produção a partir de venda (mover de aberto para em_producao)
  const criarPedidoProducao = useMutation({
    mutationFn: async (vendaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar próximo número
      const { data: numeroData } = await supabase.rpc('gerar_proximo_numero', {
        tipo_documento: 'pedido_producao'
      });

      const numeroPedido = `PED-${String(numeroData || 1).padStart(6, '0')}`;

      // Criar pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .insert({
          venda_id: vendaId,
          numero_pedido: numeroPedido,
          status: 'em_andamento',
          etapa_atual: 'em_producao',
          created_by: user.id
        } as any)
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Criar registro de etapa inicial com checkboxes
      const checkboxesIniciais = ETAPAS_CONFIG.em_producao.checkboxes.map(cb => ({
        ...cb,
        checked: false
      }));

      const { error: etapaError } = await supabase
        .from('pedidos_etapas')
        .insert({
          pedido_id: pedido.id,
          etapa: 'em_producao',
          checkboxes: checkboxesIniciais as any
        });

      if (etapaError) throw etapaError;

      return pedido;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      toast({
        title: "Pedido criado",
        description: "Pedido de produção criado com sucesso"
      });
    },
    onError: (error) => {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido de produção",
        variant: "destructive"
      });
    }
  });

  // Atualizar checkbox
  const atualizarCheckbox = useMutation({
    mutationFn: async ({ 
      pedidoId, 
      checkboxId 
    }: { 
      pedidoId: string; 
      checkboxId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const etapaAtual = await getEtapaAtual(pedidoId);
      if (!etapaAtual) throw new Error('Etapa atual não encontrada');

      const checkboxes = etapaAtual.checkboxes.map(cb => 
        cb.id === checkboxId 
          ? { 
              ...cb, 
              checked: !cb.checked,
              checked_at: !cb.checked ? new Date().toISOString() : undefined,
              checked_by: !cb.checked ? user.id : undefined
            }
          : cb
      );

      const { error } = await supabase
        .from('pedidos_etapas')
        .update({ checkboxes: checkboxes as any })
        .eq('id', etapaAtual.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar checkbox:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o checkbox",
        variant: "destructive"
      });
    }
  });

  // Mover para próxima etapa
  const moverParaProximaEtapa = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar pedido atual
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_producao')
        .select('etapa_atual')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      const etapaAtualNome = pedido.etapa_atual as EtapaPedido;
      const proximaEtapa = getProximaEtapa(etapaAtualNome);

      if (!proximaEtapa) {
        throw new Error('Pedido já está na última etapa');
      }

      // Validar checkboxes obrigatórios
      const etapaAtual = await getEtapaAtual(pedidoId);
      if (etapaAtual) {
        const checkboxesObrigatorios = etapaAtual.checkboxes.filter(cb => cb.required);
        const todosChecados = checkboxesObrigatorios.every(cb => cb.checked);

        if (!todosChecados) {
          throw new Error('Todos os checkboxes obrigatórios devem ser marcados');
        }

        // Fechar etapa atual
        await supabase
          .from('pedidos_etapas')
          .update({ data_saida: new Date().toISOString() })
          .eq('id', etapaAtual.id);
      }

      // Criar nova etapa com checkboxes
      const checkboxesNovos = ETAPAS_CONFIG[proximaEtapa].checkboxes.map(cb => ({
        ...cb,
        checked: false
      }));

      const { error: etapaError } = await supabase
        .from('pedidos_etapas')
        .insert({
          pedido_id: pedidoId,
          etapa: proximaEtapa,
          checkboxes: checkboxesNovos as any
        });

      if (etapaError) throw etapaError;

      // Atualizar pedido
      const { error: updateError } = await supabase
        .from('pedidos_producao')
        .update({ 
          etapa_atual: proximaEtapa,
          status: proximaEtapa === 'finalizado' ? 'concluido' : 'em_andamento'
        })
        .eq('id', pedidoId);

      if (updateError) throw updateError;

      return { etapaAtualNome, proximaEtapa };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      toast({
        title: "Etapa avançada",
        description: `Pedido movido para ${ETAPAS_CONFIG[data.proximaEtapa].label}`
      });
    },
    onError: (error: any) => {
      console.error('Erro ao mover etapa:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível avançar a etapa",
        variant: "destructive"
      });
    }
  });

  return {
    pedidos,
    isLoading,
    criarPedidoProducao,
    atualizarCheckbox,
    moverParaProximaEtapa,
    getEtapaAtual
  };
}
