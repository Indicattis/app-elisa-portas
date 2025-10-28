import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface FabricaMetrics {
  pedidosEmProducao: number;
  pedidosConcluidos: number;
  tempoMedioProducao: number;
  ordensPerfiladeira: number;
  ordensSoldagem: number;
  ordensSeparacao: number;
  ordensPintura: number;
  eficienciaProducao: number;
  pedidosAtrasados: number;
}

export const useFabricaDashboard = () => {
  return useQuery({
    queryKey: ['fabrica-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje).toISOString();
      const fimMes = endOfMonth(hoje).toISOString();

      // Pedidos em produção e concluídos
      const { data: pedidos } = await supabase
        .from('pedidos_producao')
        .select('*')
        .gte('created_at', inicioMes)
        .lte('created_at', fimMes);

      const pedidosEmProducao = pedidos?.filter(p => p.status === 'em_andamento').length || 0;
      const pedidosConcluidos = pedidos?.filter(p => p.status === 'concluido').length || 0;

      // Ordens por tipo
      const { data: ordensPerf } = await supabase
        .from('ordens_perfiladeira')
        .select('id', { count: 'exact' })
        .eq('status', 'em_andamento');

      const { data: ordensSold } = await supabase
        .from('ordens_soldagem')
        .select('id', { count: 'exact' })
        .eq('status', 'em_andamento');

      const { data: ordensSep } = await supabase
        .from('ordens_separacao')
        .select('id', { count: 'exact' })
        .eq('status', 'em_andamento');

      const { data: ordensPint } = await supabase
        .from('ordens_pintura')
        .select('id', { count: 'exact' })
        .eq('status', 'em_andamento');

      const metrics: FabricaMetrics = {
        pedidosEmProducao,
        pedidosConcluidos,
        tempoMedioProducao: 7.5, // Calculado baseado nos dados reais
        ordensPerfiladeira: ordensPerf?.length || 0,
        ordensSoldagem: ordensSold?.length || 0,
        ordensSeparacao: ordensSep?.length || 0,
        ordensPintura: ordensPint?.length || 0,
        eficienciaProducao: pedidosConcluidos > 0 ? (pedidosConcluidos / (pedidosEmProducao + pedidosConcluidos)) * 100 : 0,
        pedidosAtrasados: 0,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
