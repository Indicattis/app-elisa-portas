import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdministrativoMetrics {
  totalItensEstoque: number;
  valorTotalEstoque: number;
  produtosEstoqueBaixo: number;
  movimentacoesRecentes: number;
  comprasPendentes: number;
  documentosRecentes: number;
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
      const valorTotal = estoque?.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0) || 0;
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

      const metrics: AdministrativoMetrics = {
        totalItensEstoque: totalItens,
        valorTotalEstoque: valorTotal,
        produtosEstoqueBaixo: estoqueBaixo,
        movimentacoesRecentes: movimentacoes?.length || 0,
        comprasPendentes: 0,
        documentosRecentes: documentos?.length || 0,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5,
  });
};
