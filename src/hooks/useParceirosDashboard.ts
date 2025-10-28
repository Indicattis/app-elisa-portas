import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface ParceiroMetrics {
  totalAtivos: number;
  autorizadosPorRegiao: { estado: string; total: number }[];
  rankingPerformance: { nome: string; nota: number }[];
  novosNoMes: number;
  autorizadosAptos: number;
  representantesAtivos: number;
  licenciadosAtivos: number;
}

export const useParceirosDashboard = () => {
  return useQuery({
    queryKey: ['parceiros-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje).toISOString();
      const fimMes = endOfMonth(hoje).toISOString();

      // Autorizados ativos
      const { data: autorizados } = await supabase
        .from('autorizados')
        .select('*')
        .eq('ativo', true);

      const totalAtivos = autorizados?.length || 0;

      // Novos no mês
      const novosNoMes = autorizados?.filter(a => 
        a.created_at >= inicioMes && a.created_at <= fimMes
      ).length || 0;

      // Por região
      const autorizadosPorEstado = autorizados?.reduce((acc: { [key: string]: number }, a) => {
        if (a.estado) {
          acc[a.estado] = (acc[a.estado] || 0) + 1;
        }
        return acc;
      }, {});

      const regiaoArray = Object.entries(autorizadosPorEstado || {})
        .map(([estado, total]) => ({ estado, total: total as number }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Representantes e Licenciados
      const representantes = autorizados?.filter(a => a.tipo_parceiro === 'representante').length || 0;
      const licenciados = autorizados?.filter(a => a.tipo_parceiro === 'licenciado').length || 0;

      // Ranking (últimas avaliações)
      const { data: ratings } = await supabase
        .from('autorizados_ratings')
        .select(`
          autorizado_id,
          nota,
          autorizados!inner(nome)
        `)
        .gte('created_at', inicioMes)
        .order('nota', { ascending: false })
        .limit(5);

      const ranking = ratings?.map(r => ({
        nome: (r.autorizados as any)?.nome || 'N/A',
        nota: r.nota,
      })) || [];

      const metrics: ParceiroMetrics = {
        totalAtivos,
        autorizadosPorRegiao: regiaoArray,
        rankingPerformance: ranking,
        novosNoMes,
        autorizadosAptos: 0,
        representantesAtivos: representantes,
        licenciadosAtivos: licenciados,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5,
  });
};
