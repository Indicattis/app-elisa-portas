import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface InstalacoesMetrics {
  instalacoesPendentes: number;
  instalacoesConcluidasMes: number;
  tempoMedioInstalacao: number;
  distribuicaoEstados: { estado: string; total: number }[];
  equipes: { nome: string; instalacoes: number }[];
  instalacoesSemana: number;
  taxaRetrabalho: number;
}

export const useInstalacoesDashboard = () => {
  return useQuery({
    queryKey: ['instalacoes-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje).toISOString();
      const fimMes = endOfMonth(hoje).toISOString();

      // Instalações pendentes
      const { data: pendentes } = await supabase
        .from('instalacoes')
        .select('id', { count: 'exact' })
        .in('status', ['pendente_producao', 'pronta_fabrica']);

      // Instalações concluídas no mês
      const { data: concluidas } = await supabase
        .from('instalacoes')
        .select('id', { count: 'exact' })
        .eq('status', 'finalizada')
        .gte('updated_at', inicioMes)
        .lte('updated_at', fimMes);

      // Distribuição por estados através das vendas
      const { data: instalacoes } = await supabase
        .from('instalacoes')
        .select(`
          venda:vendas!venda_id(estado)
        `);

      const distribuicaoEstados = instalacoes?.reduce((acc: { [key: string]: number }, item: any) => {
        const estado = item.venda?.estado;
        if (estado) {
          acc[estado] = (acc[estado] || 0) + 1;
        }
        return acc;
      }, {});

      const estadosArray = Object.entries(distribuicaoEstados || {}).map(([estado, total]) => ({
        estado,
        total: total as number,
      })).sort((a, b) => b.total - a.total).slice(0, 5);

      const metrics: InstalacoesMetrics = {
        instalacoesPendentes: pendentes?.length || 0,
        instalacoesConcluidasMes: concluidas?.length || 0,
        tempoMedioInstalacao: 3.2,
        distribuicaoEstados: estadosArray,
        equipes: [],
        instalacoesSemana: 0,
        taxaRetrabalho: 0,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5,
  });
};
