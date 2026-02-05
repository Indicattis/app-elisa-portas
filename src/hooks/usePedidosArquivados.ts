import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoArquivado {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  data_arquivamento: string | null;
  arquivado_por: string | null;
  arquivado_por_nome?: string;
  etapa_atual: string;
  data_entrega: string | null;
  modalidade_instalacao: string | null;
  venda_id: string | null;
  valor_venda: number | null;
  created_at: string;
}

export function usePedidosArquivados(search: string = '') {
  return useQuery({
    queryKey: ['pedidos-arquivados', search],
    queryFn: async () => {
      // Buscar pedidos arquivados
      let query = supabase
        .from('pedidos_producao')
        .select(`
          id,
          numero_pedido,
          cliente_nome,
          data_arquivamento,
          arquivado_por,
          etapa_atual,
          data_entrega,
          modalidade_instalacao,
          venda_id,
          valor_venda,
          created_at
        `)
        .eq('arquivado', true)
        .order('data_arquivamento', { ascending: false });

      // Aplicar filtro de busca se fornecido
      if (search.trim()) {
        query = query.or(`numero_pedido.ilike.%${search}%,cliente_nome.ilike.%${search}%`);
      }

      const { data: pedidos, error } = await query;

      if (error) {
        console.error('Erro ao buscar pedidos arquivados:', error);
        throw error;
      }

      if (!pedidos || pedidos.length === 0) {
        return [];
      }

      // Buscar IDs únicos de quem arquivou
      const arquivadoPorIds = [...new Set(pedidos.map(p => p.arquivado_por).filter(Boolean))] as string[];
      
      // Buscar nomes de quem arquivou
      let userNames: Record<string, string> = {};
      if (arquivadoPorIds.length > 0) {
        const { data: users } = await supabase
          .from('admin_users')
          .select('user_id, nome')
          .in('user_id', arquivadoPorIds);
        
        if (users) {
          userNames = users.reduce((acc, u) => {
            acc[u.user_id] = u.nome;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Montar resultado final
      return pedidos.map(pedido => ({
        ...pedido,
        arquivado_por_nome: pedido.arquivado_por ? userNames[pedido.arquivado_por] : undefined,
      })) as PedidoArquivado[];
    },
    staleTime: 30 * 1000, // 30 segundos
  });
}
