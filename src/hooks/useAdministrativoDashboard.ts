import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { calcularFaturamentoLiquido, isVendaValida } from '@/utils/faturamentoCalc';

export interface AdministrativoMetrics {
  totalItensEstoque: number;
  valorTotalEstoque: number;
  produtosEstoqueBaixo: number;
  movimentacoesRecentes: number;
  comprasPendentes: number;
  documentosRecentes: number;
  faturamentoMes: number;
  vendasMes: number;
  usuariosAtivos: number;
  usuariosInativos: number;
}

export const useAdministrativoDashboard = () => {
  return useQuery({
    queryKey: ['administrativo-dashboard'],
    queryFn: async () => {
      // Estoque
      const { data: estoque } = await supabase
        .from('estoque')
        .select('*')
        .eq('ativo', true);

      const totalItens = estoque?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
      const valorTotal = estoque?.reduce((sum, item) => sum + (item.quantidade * item.custo_unitario), 0) || 0;
      const estoqueBaixo = estoque?.filter(item => item.quantidade < 10).length || 0;

      // Movimentações (últimos 7 dias)
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      const { data: movimentacoes } = await supabase
        .from('estoque_movimentacoes')
        .select('id', { count: 'exact' })
        .gte('created_at', seteDiasAtras.toISOString());

      // Documentos recentes (últimos 30 dias)
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const { data: documentos } = await supabase
        .from('documentos')
        .select('id', { count: 'exact' })
        .gte('created_at', trintaDiasAtras.toISOString());

      // Faturamento do mês atual
      const hoje = new Date();
      const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd');
      const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd');

      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_venda, valor_frete, valor_credito')
        .gte('data_venda', inicioMes)
        .lte('data_venda', fimMes)
        .not('custo_total', 'is', null);

      const vendasValidas = (vendas || []).filter(isVendaValida);
      const faturamentoMes = vendasValidas.reduce((sum, v) => sum + calcularFaturamentoLiquido(v), 0);
      const vendasMes = vendasValidas.length;

      // Usuários do organograma
      const { data: usuariosAtivos } = await supabase
        .from('admin_users')
        .select('id', { count: 'exact' })
        .eq('ativo', true);

      const { data: usuariosInativos } = await supabase
        .from('admin_users')
        .select('id', { count: 'exact' })
        .eq('ativo', false);

      const metrics: AdministrativoMetrics = {
        totalItensEstoque: totalItens,
        valorTotalEstoque: valorTotal,
        produtosEstoqueBaixo: estoqueBaixo,
        movimentacoesRecentes: movimentacoes?.length || 0,
        comprasPendentes: 0,
        documentosRecentes: documentos?.length || 0,
        faturamentoMes,
        vendasMes,
        usuariosAtivos: usuariosAtivos?.length || 0,
        usuariosInativos: usuariosInativos?.length || 0,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5,
  });
};
