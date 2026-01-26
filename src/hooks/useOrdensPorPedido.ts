import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

export interface OrdemStatus {
  existe: boolean;
  id: string | null;
  numero_ordem: string | null;
  status: string | null;
  tipo: TipoOrdem;
}

export interface PedidoComOrdens {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  etapa_atual: string;
  prioridade_etapa: number | null;
  ordens: {
    soldagem: OrdemStatus;
    perfiladeira: OrdemStatus;
    separacao: OrdemStatus;
    qualidade: OrdemStatus;
    pintura: OrdemStatus;
  };
}

type EtapaPedido = 'aberto' | 'em_producao' | 'inspecao_qualidade' | 'pintura' | 'aguardando_coleta' | 'concluido';

const TABELA_ORDENS: Record<TipoOrdem, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
  qualidade: 'ordens_qualidade',
  pintura: 'ordens_pintura',
};

export function useOrdensPorPedido(etapa: EtapaPedido) {
  return useQuery({
    queryKey: ['ordens-por-pedido', etapa],
    queryFn: async (): Promise<PedidoComOrdens[]> => {
      // Buscar pedidos da etapa
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos_producao')
        .select(`
          id,
          numero_pedido,
          etapa_atual,
          prioridade_etapa,
          venda:venda_id (
            cliente:cliente_id (nome)
          )
        `)
        .eq('etapa_atual', etapa)
        .order('prioridade_etapa', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (pedidosError) {
        console.error('Erro ao buscar pedidos:', pedidosError);
        return [];
      }

      if (!pedidos || pedidos.length === 0) return [];

      const pedidoIds = pedidos.map(p => p.id);

      // Buscar ordens de todas as tabelas em paralelo
      const [soldagem, perfiladeira, separacao, qualidade, pintura] = await Promise.all([
        supabase
          .from('ordens_soldagem')
          .select('id, pedido_id, numero_ordem, status')
          .in('pedido_id', pedidoIds),
        supabase
          .from('ordens_perfiladeira')
          .select('id, pedido_id, numero_ordem, status')
          .in('pedido_id', pedidoIds),
        supabase
          .from('ordens_separacao')
          .select('id, pedido_id, numero_ordem, status')
          .in('pedido_id', pedidoIds),
        supabase
          .from('ordens_qualidade')
          .select('id, pedido_id, numero_ordem, status')
          .in('pedido_id', pedidoIds),
        supabase
          .from('ordens_pintura')
          .select('id, pedido_id, numero_ordem, status')
          .in('pedido_id', pedidoIds),
      ]);

      // Criar mapa de ordens por pedido_id
      const ordensMap: Record<string, Record<TipoOrdem, any>> = {};
      
      const processOrdens = (data: any[] | null, tipo: TipoOrdem) => {
        if (!data) return;
        data.forEach(ordem => {
          if (!ordensMap[ordem.pedido_id]) {
            ordensMap[ordem.pedido_id] = {} as Record<TipoOrdem, any>;
          }
          ordensMap[ordem.pedido_id][tipo] = ordem;
        });
      };

      processOrdens(soldagem.data, 'soldagem');
      processOrdens(perfiladeira.data, 'perfiladeira');
      processOrdens(separacao.data, 'separacao');
      processOrdens(qualidade.data, 'qualidade');
      processOrdens(pintura.data, 'pintura');

      // Consolidar pedidos com ordens
      const resultado: PedidoComOrdens[] = pedidos.map(pedido => {
        const ordensDosPedido = ordensMap[pedido.id] || {};
        
        const criarOrdemStatus = (tipo: TipoOrdem): OrdemStatus => {
          const ordem = ordensDosPedido[tipo];
          return {
            existe: !!ordem,
            id: ordem?.id || null,
            numero_ordem: ordem?.numero_ordem || null,
            status: ordem?.status || null,
            tipo,
          };
        };

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          cliente_nome: (pedido.venda as any)?.cliente?.nome || 'Cliente não encontrado',
          etapa_atual: pedido.etapa_atual,
          prioridade_etapa: pedido.prioridade_etapa,
          ordens: {
            soldagem: criarOrdemStatus('soldagem'),
            perfiladeira: criarOrdemStatus('perfiladeira'),
            separacao: criarOrdemStatus('separacao'),
            qualidade: criarOrdemStatus('qualidade'),
            pintura: criarOrdemStatus('pintura'),
          },
        };
      });

      return resultado;
    },
    staleTime: 30 * 1000, // 30 segundos
  });
}
