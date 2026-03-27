import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoArquivadoProduto {
  tamanho: string;
  tipo_produto: string;
  quantidade: number | null;
  cor_nome: string | null;
  cor_hex: string | null;
}

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
  tipo_entrega?: string | null;
  responsavel_instalacao_nome?: string | null;
  tipo_instalacao?: string | null;
  responsavel_entrega_nome?: string | null;
  produtos?: PedidoArquivadoProduto[];
}

interface UsePedidosArquivadosOptions {
  search?: string;
  dataInicio?: Date | null;
  dataFim?: Date | null;
}

export function usePedidosArquivados(searchOrOptions: string | UsePedidosArquivadosOptions = '') {
  const options: UsePedidosArquivadosOptions = typeof searchOrOptions === 'string'
    ? { search: searchOrOptions }
    : searchOrOptions;

  const { search = '', dataInicio = null, dataFim = null } = options;

  return useQuery({
    queryKey: ['pedidos-arquivados', search, dataInicio?.toISOString(), dataFim?.toISOString()],
    queryFn: async () => {
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
          created_at,
          vendas:venda_id(
            tipo_entrega,
            produtos_vendas(
              tamanho,
              tipo_produto,
              quantidade,
              catalogo_cores:cor_id(nome, codigo_hex)
            )
          ),
          instalacoes!instalacoes_pedido_id_fkey(
            responsavel_instalacao_nome,
            tipo_instalacao
          ),
          ordens_carregamento!ordens_carregamento_pedido_id_fkey(
            responsavel_carregamento_nome
          )
        `)
        .eq('arquivado', true)
        .order('data_arquivamento', { ascending: false });

      if (search.trim()) {
        query = query.or(`numero_pedido.ilike.%${search}%,cliente_nome.ilike.%${search}%`);
      }

      if (dataInicio) {
        query = query.gte('data_arquivamento', dataInicio.toISOString());
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        query = query.lte('data_arquivamento', fim.toISOString());
      }

      const { data: pedidos, error } = await query;

      if (error) {
        console.error('Erro ao buscar pedidos arquivados:', error);
        throw error;
      }

      if (!pedidos || pedidos.length === 0) {
        return [];
      }

      const arquivadoPorIds = [...new Set(pedidos.map(p => p.arquivado_por).filter(Boolean))] as string[];
      
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

      return pedidos.map(pedido => {
        const vendaData = pedido.vendas as any;
        const instalacaoData = (pedido as any).instalacoes;
        const carregamentoData = (pedido as any).ordens_carregamento;
        
        const instalacao = Array.isArray(instalacaoData) ? instalacaoData[0] : instalacaoData;
        const carregamento = Array.isArray(carregamentoData) ? carregamentoData[0] : carregamentoData;

        // Map portas_vendas to produtos
        const portasVendas = vendaData?.portas_vendas || [];
        const produtos: PedidoArquivadoProduto[] = Array.isArray(portasVendas)
          ? portasVendas
              .filter((p: any) => p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta')
              .map((p: any) => ({
                tamanho: p.tamanho,
                tipo_produto: p.tipo_produto,
                quantidade: p.quantidade,
                cor_nome: p.catalogo_cores?.nome || null,
                cor_hex: p.catalogo_cores?.codigo_hex || null,
              }))
          : [];
        
        return {
          ...pedido,
          arquivado_por_nome: pedido.arquivado_por ? userNames[pedido.arquivado_por] : undefined,
          tipo_entrega: vendaData?.tipo_entrega || null,
          responsavel_instalacao_nome: instalacao?.responsavel_instalacao_nome || null,
          tipo_instalacao: instalacao?.tipo_instalacao || null,
          responsavel_entrega_nome: carregamento?.responsavel_carregamento_nome || null,
          produtos,
          vendas: undefined,
          instalacoes: undefined,
          ordens_carregamento: undefined,
        };
      }) as PedidoArquivado[];
    },
    staleTime: 30 * 1000,
  });
}
