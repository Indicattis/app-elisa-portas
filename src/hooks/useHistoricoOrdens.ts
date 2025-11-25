import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TipoOrdem = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura' | 'carregamento' | 'arquivado';

interface OrdemHistorico {
  id: string;
  numero_ordem: string;
  tipo_ordem: TipoOrdem;
  pedido_id: string;
  status: string;
  created_at: string;
  data_conclusao?: string;
  tempo_conclusao_segundos?: number;
  responsavel_id?: string;
  observacoes?: string;
  pedido?: {
    id: string;
    numero_pedido: string;
    cliente_nome: string;
  };
  admin_users?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

interface HistoricoFilters {
  tipoOrdem?: TipoOrdem | 'todos';
  dataInicio?: Date;
  dataFim?: Date;
  busca?: string;
  responsavelId?: string;
}

const TABELA_MAP: Record<Exclude<TipoOrdem, 'arquivado'>, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
  qualidade: 'ordens_qualidade',
  pintura: 'ordens_pintura',
  carregamento: 'ordens_carregamento',
};

export function useHistoricoOrdens(filters: HistoricoFilters = {}) {
  return useQuery({
    queryKey: ['historico-ordens', filters],
    queryFn: async () => {
      const allOrdens: OrdemHistorico[] = [];
      
      // Determinar quais tabelas buscar
      const tiposParaBuscar: TipoOrdem[] = 
        filters.tipoOrdem && filters.tipoOrdem !== 'todos' 
          ? [filters.tipoOrdem]
          : ['soldagem', 'perfiladeira', 'separacao', 'qualidade', 'pintura', 'carregamento'];
      
      // Buscar de todas as tabelas em paralelo
      const promises = tiposParaBuscar.map(async (tipo) => {
        const tabela = TABELA_MAP[tipo];
        
        // Para carregamento, usar campo carregamento_concluido_em ao invés de data_conclusao
        const campoData = tipo === 'carregamento' ? 'carregamento_concluido_em' : 'data_conclusao';
        const campoHistorico = tipo === 'carregamento' ? 'carregamento_concluido' : 'historico';
        
        let query = supabase
          .from(tabela as any)
          .select(`
            *,
            pedido:pedidos_producao!pedido_id(
              id,
              numero_pedido,
              cliente_nome,
              arquivado
            )
          `)
          .eq(campoHistorico, true)
          .order(campoData, { ascending: false });
        
        // Aplicar filtros
        if (filters.dataInicio) {
          query = query.gte(campoData, filters.dataInicio.toISOString());
        }
        
        if (filters.dataFim) {
          const dataFimFinal = new Date(filters.dataFim);
          dataFimFinal.setHours(23, 59, 59, 999);
          query = query.lte(campoData, dataFimFinal.toISOString());
        }
        
        if (filters.responsavelId) {
          const campoResponsavel = tipo === 'carregamento' ? 'responsavel_carregamento_id' : 'responsavel_id';
          query = query.eq(campoResponsavel, filters.responsavelId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Mapear dados adicionando o tipo de ordem
        // Filtrar apenas ordens cujos pedidos estão arquivados
        return (data || [])
          .filter((ordem: any) => ordem.pedido?.arquivado === true)
          .map((ordem: any) => {
            // Para carregamento, mapear campos específicos
            if (tipo === 'carregamento') {
              return {
                ...ordem,
                tipo_ordem: tipo,
                data_conclusao: ordem.carregamento_concluido_em,
                responsavel_id: ordem.responsavel_carregamento_id,
                numero_ordem: `CARG-${ordem.id.substring(0, 8)}`,
              };
            }
            return {
              ...ordem,
              tipo_ordem: tipo,
            };
          });
      });
      
      const results = await Promise.all(promises);
      results.forEach(ordens => allOrdens.push(...ordens));

      // Buscar pedidos arquivados
      let queryPedidos = supabase
        .from('pedidos_producao')
        .select(`
          *,
          vendas:venda_id (
            id,
            cliente_nome,
            cliente_telefone,
            valor_venda,
            created_at
          )
        `)
        .eq('arquivado', true);

      // Aplicar filtros de data nos pedidos arquivados
      if (filters.dataInicio) {
        queryPedidos = queryPedidos.gte('data_arquivamento', filters.dataInicio.toISOString());
      }
      if (filters.dataFim) {
        const dataFimFinal = new Date(filters.dataFim);
        dataFimFinal.setHours(23, 59, 59, 999);
        queryPedidos = queryPedidos.lte('data_arquivamento', dataFimFinal.toISOString());
      }

      const { data: pedidosArquivados } = await queryPedidos.order('data_arquivamento', { ascending: false });

      // Converter pedidos arquivados para o formato de ordem
      if (pedidosArquivados) {
        for (const pedido of pedidosArquivados) {
          allOrdens.push({
            id: pedido.id,
            numero_ordem: pedido.numero_pedido,
            pedido_id: pedido.id,
            tipo_ordem: 'arquivado' as any,
            status: 'arquivado',
            responsavel_id: pedido.arquivado_por,
            data_conclusao: pedido.data_arquivamento,
            created_at: pedido.created_at,
            pedido: {
              id: pedido.id,
              numero_pedido: pedido.numero_pedido,
              cliente_nome: (pedido.vendas as any)?.cliente_nome || '',
            },
            admin_users: null
          } as any);
        }
      }
      
      // Buscar dados dos responsáveis
      const responsavelIds = allOrdens
        .map(o => o.responsavel_id)
        .filter((id): id is string => id !== null && id !== undefined);
      
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
      
      // Adicionar informações dos responsáveis e aplicar filtro de busca
      let ordensComResponsaveis = allOrdens.map(ordem => ({
        ...ordem,
        admin_users: ordem.responsavel_id ? responsaveisMap[ordem.responsavel_id] || null : null,
      }));
      
      // Aplicar filtro de busca (cliente ou número da ordem)
      if (filters.busca) {
        const buscaLower = filters.busca.toLowerCase();
        ordensComResponsaveis = ordensComResponsaveis.filter(ordem => 
          ordem.numero_ordem.toLowerCase().includes(buscaLower) ||
          ordem.pedido?.cliente_nome?.toLowerCase().includes(buscaLower) ||
          ordem.pedido?.numero_pedido?.toLowerCase().includes(buscaLower)
        );
      }
      
      // Ordenar por data de conclusão (mais recente primeiro)
      ordensComResponsaveis.sort((a, b) => {
        const dataA = new Date(a.data_conclusao || a.created_at).getTime();
        const dataB = new Date(b.data_conclusao || b.created_at).getTime();
        return dataB - dataA;
      });
      
      return ordensComResponsaveis as OrdemHistorico[];
    },
  });
}
