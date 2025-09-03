import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DiaVenda {
  data: string;
  valor: number;
}

interface VendedorRanking {
  nome: string;
  total_vendas: number;
  posicao: number;
  foto_perfil_url?: string;
}

export const useSalesData = () => {
  return useQuery({
    queryKey: ['vendas-mes'],
    queryFn: async (): Promise<DiaVenda[]> => {
      const hoje = new Date();
      const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('contador_vendas_dias')
        .select('data, valor')
        .gte('data', format(primeiroDiaDoMes, 'yyyy-MM-dd'))
        .lte('data', format(ultimoDiaDoMes, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        throw error;
      }

      // Agrupar por data e somar valores
      const vendasPorDia = (data || []).reduce((acc: { [key: string]: number }, venda: any) => {
        const dataKey = venda.data;
        acc[dataKey] = (acc[dataKey] || 0) + Number(venda.valor);
        return acc;
      }, {});

      return Object.entries(vendasPorDia).map(([data, valor]) => ({
        data,
        valor: valor as number
      }));
    },
    refetchInterval: 120000, // 2 minutes fallback
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useSellersRanking = () => {
  return useQuery({
    queryKey: ['ranking-vendedores'],
    queryFn: async (): Promise<VendedorRanking[]> => {
      const hoje = new Date();
      const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('contador_vendas_dias')
        .select(`
          valor,
          atendente_id,
          admin_users!inner(nome, foto_perfil_url)
        `)
        .gte('data', format(primeiroDiaDoMes, 'yyyy-MM-dd'))
        .lte('data', format(ultimoDiaDoMes, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar ranking:', error);
        throw error;
      }

      // Agrupar por atendente e somar valores
      const vendasPorAtendente = (data || []).reduce((acc: { [key: string]: any }, venda: any) => {
        const atendenteId = venda.atendente_id;
        if (!acc[atendenteId]) {
          acc[atendenteId] = {
            nome: venda.admin_users?.nome || 'N/A',
            foto_perfil_url: venda.admin_users?.foto_perfil_url,
            total_vendas: 0
          };
        }
        acc[atendenteId].total_vendas += Number(venda.valor);
        return acc;
      }, {});

      // Converter para array e ordenar
      const ranking = Object.values(vendasPorAtendente)
        .sort((a: any, b: any) => b.total_vendas - a.total_vendas)
        .map((vendedor: any, index: number) => ({
          ...vendedor,
          posicao: index + 1
        }));

      return ranking;
    },
    refetchInterval: 120000, // 2 minutes fallback
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useWhatsAppRoulette = () => {
  return useQuery({
    queryKey: ['whatsapp-roulette-stats'],
    queryFn: async (): Promise<{ nome: string; total_clicks: number }[]> => {
      // Retorna array vazio temporariamente até a tabela ser criada
      return [];
    },
    refetchInterval: 120000, // 2 minutes fallback
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useDashboardRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contador_vendas_dias'
        },
        () => {
          // Debounced invalidation
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['vendas-mes'] });
            queryClient.invalidateQueries({ queryKey: ['ranking-vendedores'] });
          }, 500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_users'
        },
        () => {
          // Debounced invalidation
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['ranking-vendedores'] });
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};