import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrdemPortaSocial {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  delegado_para_id?: string;
  delegado_por_id?: string;
  delegado_em?: string;
  capturada_em?: string;
  data_conclusao?: string;
  tempo_conclusao_segundos?: number;
  em_backlog?: boolean;
  prioridade?: number;
  historico?: boolean;
  observacoes?: string;
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
    venda_id?: string;
    vendas?: {
      data_prevista_entrega?: string;
      observacoes_venda?: string;
    };
  };
  delegado_para?: {
    nome: string;
    foto_perfil_url?: string;
  };
  delegado_por?: {
    nome: string;
  };
}

export function useOrdemPortaSocial(onOrdemConcluida?: (pedidoId: string) => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar todas as ordens de porta social
  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ['ordens-porta-social'],
    queryFn: async () => {
      const { data: ordensData, error: ordensError } = await supabase
        .from('ordens_porta_social')
        .select(`
          *,
          pedido:pedidos_producao!pedido_id(
            id,
            numero_pedido,
            cliente_nome,
            venda_id,
            prioridade_etapa,
            em_backlog,
            vendas(
              data_prevista_entrega,
              observacoes_venda,
              produtos_vendas(
                id,
                tipo_produto,
                tamanho,
                cor_id,
                valor_pintura,
                quantidade,
                descricao,
                largura,
                altura,
                tipo_fabricacao,
                catalogo_cores:cor_id(nome, codigo_hex)
              )
            )
          )
        `)
        .eq('historico', false)
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: true });

      if (ordensError) throw ordensError;
      if (!ordensData || ordensData.length === 0) return [];

      // Buscar dados dos usuários delegados
      const delegadoParaIds = ordensData
        .map((o: any) => o.delegado_para_id)
        .filter((id: string | null) => id !== null);

      const delegadoPorIds = ordensData
        .map((o: any) => o.delegado_por_id)
        .filter((id: string | null) => id !== null);

      const allUserIds = [...new Set([...delegadoParaIds, ...delegadoPorIds])];

      let usuariosMap: Record<string, any> = {};
      if (allUserIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('admin_users')
          .select('user_id, nome, foto_perfil_url')
          .in('user_id', allUserIds);

        if (usuarios) {
          usuariosMap = usuarios.reduce((acc, u) => {
            acc[u.user_id] = u;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return ordensData.map((ordem: any) => {
        // Processar pedido e vendas
        let pedidoProcessado = null;
        if (ordem.pedido) {
          const vendasArray = Array.isArray(ordem.pedido.vendas) ? ordem.pedido.vendas : [ordem.pedido.vendas];
          const primeiraVenda = vendasArray.length > 0 ? vendasArray[0] : null;

          // Processar produtos_vendas com cores
          const produtos = primeiraVenda?.produtos_vendas?.map((pv: any) => {
            const corData = Array.isArray(pv.catalogo_cores) ? pv.catalogo_cores[0] : pv.catalogo_cores;
            return {
              ...pv,
              cor_nome: corData?.nome,
              cor_codigo_hex: corData?.codigo_hex,
            };
          }) || [];

          pedidoProcessado = {
            id: ordem.pedido.id,
            numero_pedido: ordem.pedido.numero_pedido,
            cliente_nome: ordem.pedido.cliente_nome,
            venda_id: ordem.pedido.venda_id,
            vendas: primeiraVenda ? { ...primeiraVenda, produtos_vendas: undefined } : null,
            produtos,
          };
        }

        return {
          ...ordem,
          pedido: pedidoProcessado,
          delegado_para: ordem.delegado_para_id ? usuariosMap[ordem.delegado_para_id] || null : null,
          delegado_por: ordem.delegado_por_id ? usuariosMap[ordem.delegado_por_id] || null : null,
        };
      }) as OrdemPortaSocial[];
    },
  });

  // DELEGAR ordem (diferente de capturar)
  const delegarOrdem = useMutation({
    mutationFn: async ({ ordemId, userId }: { ordemId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('ordens_porta_social')
        .update({
          delegado_para_id: userId,
          delegado_por_id: user.id,
          delegado_em: new Date().toISOString(),
          status: 'em_andamento',
          capturada_em: new Date().toISOString(),
        })
        .eq('id', ordemId);

      if (error) throw error;
      return ordemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-porta-social'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-count'] });
      toast({
        title: "Ordem delegada",
        description: "A ordem foi atribuída ao colaborador selecionado.",
      });
    },
    onError: (error) => {
      console.error('Erro ao delegar ordem:', error);
      toast({
        title: "Erro ao delegar",
        description: "Não foi possível delegar a ordem.",
        variant: "destructive",
      });
    },
  });

  // Concluir ordem
  const concluirOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      // Buscar ordem para pegar pedido_id e capturada_em
      const { data: ordem, error: ordemError } = await supabase
        .from('ordens_porta_social')
        .select('pedido_id, capturada_em')
        .eq('id', ordemId)
        .maybeSingle();

      if (ordemError) throw ordemError;
      if (!ordem) throw new Error('Ordem não encontrada');

      const pedidoId = ordem.pedido_id;

      // Calcular tempo de conclusão
      let tempo_conclusao_segundos = null;
      if (ordem.capturada_em) {
        const captura = new Date(ordem.capturada_em);
        const agora = new Date();
        tempo_conclusao_segundos = Math.floor((agora.getTime() - captura.getTime()) / 1000);
      }

      // Atualizar ordem como concluída e enviar para histórico
      const { error } = await supabase
        .from('ordens_porta_social')
        .update({
          status: 'concluido',
          data_conclusao: new Date().toISOString(),
          tempo_conclusao_segundos,
          historico: true,
        })
        .eq('id', ordemId);

      if (error) throw error;

      return pedidoId;
    },
    onSuccess: async (pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-porta-social'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-count'] });
      queryClient.invalidateQueries({ queryKey: ['historico-ordens'] });

      toast({
        title: "Ordem concluída",
        description: "A ordem foi enviada para o histórico.",
      });

      // Tentar avanço automático do pedido
      if (onOrdemConcluida) {
        onOrdemConcluida(pedidoId);
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

  // Separar ordens por status e ordenar pela prioridade do PEDIDO
  const ordensAFazer = ordens
    .filter(o => o.status !== 'concluido')
    .sort((a, b) => {
      // Ordens com pedido em backlog primeiro
      const aBacklog = (a.pedido as any)?.em_backlog || a.em_backlog;
      const bBacklog = (b.pedido as any)?.em_backlog || b.em_backlog;
      if (aBacklog && !bBacklog) return -1;
      if (!aBacklog && bBacklog) return 1;
      // Depois por prioridade do PEDIDO (maior primeiro)
      const aPrio = (a.pedido as any)?.prioridade_etapa || 0;
      const bPrio = (b.pedido as any)?.prioridade_etapa || 0;
      if (bPrio !== aPrio) return bPrio - aPrio;
      // Desempate por created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  return {
    ordens,
    ordensAFazer,
    isLoading,
    delegarOrdem,
    concluirOrdem,
  };
}
