import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface FinanceiroMetrics {
  receitaMes: number;
  contasVencidas: number;
  contasAVencer: number;
  faturamentoPorCategoria: { categoria: string; valor: number }[];
  lucroLiquido: number;
  margemLucro: number;
}

export const useFinanceiroDashboard = () => {
  return useQuery({
    queryKey: ['financeiro-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje).toISOString();
      const fimMes = endOfMonth(hoje).toISOString();

      // Receita do mês (vendas concluídas)
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_venda, lucro_total')
        .gte('created_at', inicioMes)
        .lte('created_at', fimMes);

      const receitaMes = vendas?.reduce((sum, v) => sum + (v.valor_venda || 0), 0) || 0;
      const lucroTotal = vendas?.reduce((sum, v) => sum + (v.lucro_total || 0), 0) || 0;

      // Contas a receber
      const { data: contasVencidas } = await supabase
        .from('contas_receber')
        .select('valor_parcela')
        .eq('status', 'pendente')
        .lt('data_vencimento', new Date().toISOString());

      const { data: contasAVencer } = await supabase
        .from('contas_receber')
        .select('valor_parcela')
        .eq('status', 'pendente')
        .gte('data_vencimento', new Date().toISOString());

      const valorVencido = contasVencidas?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0;
      const valorAVencer = contasAVencer?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0;

      const metrics: FinanceiroMetrics = {
        receitaMes,
        contasVencidas: valorVencido,
        contasAVencer: valorAVencer,
        faturamentoPorCategoria: [],
        lucroLiquido: lucroTotal,
        margemLucro: receitaMes > 0 ? (lucroTotal / receitaMes) * 100 : 0,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5,
  });
};
