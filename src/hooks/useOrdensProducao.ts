import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrdemBase {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  created_at: string;
  historico?: boolean;
  tipo: 'soldagem' | 'perfiladeira' | 'separacao' | 'pintura' | 'qualidade' | 'instalacao' | 'carregamento';
  responsavel_nome?: string;
}

export interface PedidoComOrdens {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  status: string;
  etapa_atual?: string;
  created_at: string;
  ordens: OrdemBase[];
  total_ordens: number;
  contadores: {
    soldagem: number;
    perfiladeira: number;
    separacao: number;
    pintura: number;
    qualidade: number;
    instalacao: number;
    carregamento: number;
  };
}

interface UseOrdensProducaoFilters {
  search?: string;
  status?: string;
  tipoOrdem?: string;
}

export const useOrdensProducao = (filters: UseOrdensProducaoFilters = {}) => {
  const { search = '', status = '', tipoOrdem = '' } = filters;

  return useQuery({
    queryKey: ['ordens-producao', search, status, tipoOrdem],
    queryFn: async () => {
      // Buscar pedidos
      let pedidosQuery = supabase
        .from('pedidos_producao')
        .select('id, numero_pedido, cliente_nome, status, etapa_atual, created_at')
        .order('created_at', { ascending: false });

      if (search) {
        pedidosQuery = pedidosQuery.or(`cliente_nome.ilike.%${search}%,numero_pedido.ilike.%${search}%`);
      }

      if (status) {
        pedidosQuery = pedidosQuery.eq('status', status);
      }

      const { data: pedidos, error: pedidosError } = await pedidosQuery;

      if (pedidosError) throw pedidosError;
      if (!pedidos?.length) return [];

      // Buscar ordens de todas as tabelas
      const pedidoIds = pedidos.map(p => p.id);
      
      const [
        { data: ordensSoldagem },
        { data: ordensPerfiladeira },
        { data: ordensSeparacao },
        { data: ordensPintura },
        { data: ordensQualidade },
        { data: ordensInstalacao },
        { data: ordensCarregamento }
      ] = await Promise.all([
        supabase.from('ordens_soldagem').select('id, numero_ordem, pedido_id, status, created_at, historico, responsavel_id').in('pedido_id', pedidoIds),
        supabase.from('ordens_perfiladeira').select('id, numero_ordem, pedido_id, status, created_at, historico, responsavel_id').in('pedido_id', pedidoIds),
        supabase.from('ordens_separacao').select('id, numero_ordem, pedido_id, status, created_at, historico, responsavel_id').in('pedido_id', pedidoIds),
        supabase.from('ordens_pintura').select('id, numero_ordem, pedido_id, status, created_at, historico, responsavel_id').in('pedido_id', pedidoIds),
        supabase.from('ordens_qualidade').select('id, numero_ordem, pedido_id, status, created_at, historico, responsavel_id').in('pedido_id', pedidoIds),
        supabase.from('ordens_instalacao').select('id, numero_ordem, pedido_id, status, created_at, responsavel_id').in('pedido_id', pedidoIds),
        supabase.from('ordens_carregamento').select('id, pedido_id, status, created_at, carregamento_concluido, responsavel_carregamento_id').in('pedido_id', pedidoIds)
      ]);

      // Buscar nomes dos responsáveis
      const responsavelIds = new Set<string>();
      [ordensSoldagem, ordensPerfiladeira, ordensSeparacao, ordensPintura, ordensQualidade, ordensInstalacao].forEach(ordens => {
        ordens?.forEach((o: any) => {
          if (o.responsavel_id) responsavelIds.add(o.responsavel_id);
        });
      });
      ordensCarregamento?.forEach((o: any) => {
        if (o.responsavel_carregamento_id) responsavelIds.add(o.responsavel_carregamento_id);
      });

      const { data: usuarios } = await supabase
        .from('admin_users')
        .select('user_id, nome')
        .in('user_id', Array.from(responsavelIds));

      const usuariosMap = new Map(usuarios?.map(u => [u.user_id, u.nome]) || []);

      // Agrupar ordens por pedido
      const pedidosComOrdens: PedidoComOrdens[] = pedidos.map(pedido => {
        const todasOrdens: any[] = [
          ...(ordensSoldagem?.filter(o => o.pedido_id === pedido.id).map(o => ({ 
            id: o.id,
            numero_ordem: o.numero_ordem,
            pedido_id: o.pedido_id,
            status: o.status,
            created_at: o.created_at,
            historico: o.historico,
            tipo: 'soldagem' as const,
            responsavel_nome: o.responsavel_id ? usuariosMap.get(o.responsavel_id) : undefined
          })) || []),
          ...(ordensPerfiladeira?.filter(o => o.pedido_id === pedido.id).map(o => ({ 
            id: o.id,
            numero_ordem: o.numero_ordem,
            pedido_id: o.pedido_id,
            status: o.status,
            created_at: o.created_at,
            historico: o.historico,
            tipo: 'perfiladeira' as const,
            responsavel_nome: o.responsavel_id ? usuariosMap.get(o.responsavel_id) : undefined
          })) || []),
          ...(ordensSeparacao?.filter(o => o.pedido_id === pedido.id).map(o => ({ 
            id: o.id,
            numero_ordem: o.numero_ordem,
            pedido_id: o.pedido_id,
            status: o.status,
            created_at: o.created_at,
            historico: o.historico,
            tipo: 'separacao' as const,
            responsavel_nome: o.responsavel_id ? usuariosMap.get(o.responsavel_id) : undefined
          })) || []),
          ...(ordensPintura?.filter(o => o.pedido_id === pedido.id).map(o => ({ 
            id: o.id,
            numero_ordem: o.numero_ordem,
            pedido_id: o.pedido_id,
            status: o.status,
            created_at: o.created_at,
            historico: o.historico,
            tipo: 'pintura' as const,
            responsavel_nome: o.responsavel_id ? usuariosMap.get(o.responsavel_id) : undefined
          })) || []),
          ...(ordensQualidade?.filter(o => o.pedido_id === pedido.id).map(o => ({ 
            id: o.id,
            numero_ordem: o.numero_ordem,
            pedido_id: o.pedido_id,
            status: o.status,
            created_at: o.created_at,
            historico: o.historico,
            tipo: 'qualidade' as const,
            responsavel_nome: o.responsavel_id ? usuariosMap.get(o.responsavel_id) : undefined
          })) || []),
          ...(ordensInstalacao?.filter(o => o.pedido_id === pedido.id).map(o => ({ 
            id: o.id,
            numero_ordem: o.numero_ordem,
            pedido_id: o.pedido_id,
            status: o.status,
            created_at: o.created_at,
            historico: false,
            tipo: 'instalacao' as const,
            responsavel_nome: o.responsavel_id ? usuariosMap.get(o.responsavel_id) : undefined
          })) || []),
          ...(ordensCarregamento?.filter(o => o.pedido_id === pedido.id).map(o => ({ 
            id: o.id,
            numero_ordem: `CARG-${o.id.substring(0, 8)}`,
            pedido_id: o.pedido_id,
            status: o.status || '',
            created_at: o.created_at,
            historico: o.carregamento_concluido,
            tipo: 'carregamento' as const,
            responsavel_nome: o.responsavel_carregamento_id ? usuariosMap.get(o.responsavel_carregamento_id) : undefined
          })) || [])
        ];

        // Filtrar por tipo de ordem se especificado
        const ordensFiltradas = tipoOrdem 
          ? todasOrdens.filter(o => o.tipo === tipoOrdem)
          : todasOrdens;

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          cliente_nome: pedido.cliente_nome,
          status: pedido.status,
          etapa_atual: pedido.etapa_atual,
          created_at: pedido.created_at,
          ordens: ordensFiltradas,
          total_ordens: ordensFiltradas.length,
          contadores: {
            soldagem: todasOrdens.filter(o => o.tipo === 'soldagem').length,
            perfiladeira: todasOrdens.filter(o => o.tipo === 'perfiladeira').length,
            separacao: todasOrdens.filter(o => o.tipo === 'separacao').length,
            pintura: todasOrdens.filter(o => o.tipo === 'pintura').length,
            qualidade: todasOrdens.filter(o => o.tipo === 'qualidade').length,
            instalacao: todasOrdens.filter(o => o.tipo === 'instalacao').length,
            carregamento: todasOrdens.filter(o => o.tipo === 'carregamento').length,
          }
        };
      });

      // Filtrar pedidos que não têm ordens após os filtros
      return pedidosComOrdens.filter(p => p.total_ordens > 0);
    }
  });
};
