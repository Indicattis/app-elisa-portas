import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface FaturamentoPorProduto {
  tipo_produto: string;
  quantidade: number;
  valor_total: number;
}

export const useFaturamentoPorProduto = () => {
  return useQuery({
    queryKey: ['faturamento-por-produto'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      const fimMes = endOfMonth(hoje);

      // Buscar todas as vendas do mês com seus produtos
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
          id,
          data_venda,
          valor_venda,
          valor_frete,
          produtos_vendas(
            tipo_produto,
            quantidade
          )
        `)
        .gte('data_venda', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data_venda', format(fimMes, 'yyyy-MM-dd'));

      if (error) {
        console.error('Erro ao buscar faturamento por produto:', error);
        throw error;
      }

      // Agrupar por tipo de produto
      const faturamentoMap = new Map<string, { quantidade: number; valor_total: number }>();

      vendas?.forEach((venda: any) => {
        const produtos = venda.produtos_vendas || [];
        const valorVenda = Number(venda.valor_venda || 0);
        const valorFrete = Number(venda.valor_frete || 0);
        const valorSemFrete = valorVenda - valorFrete;
        
        // Se não há produtos, não contabilizar
        if (produtos.length === 0) return;
        
        // Distribuir o valor proporcionalmente entre os produtos
        const totalQuantidade = produtos.reduce((sum: number, p: any) => sum + (p.quantidade || 0), 0);
        
        produtos.forEach((produto: any) => {
          const tipo = produto.tipo_produto || 'Sem tipo';
          const quantidade = produto.quantidade || 0;
          
          // Valor proporcional baseado na quantidade
          const valorProporcional = totalQuantidade > 0 
            ? (quantidade / totalQuantidade) * valorSemFrete 
            : valorSemFrete / produtos.length;
          
          const current = faturamentoMap.get(tipo) || { quantidade: 0, valor_total: 0 };
          faturamentoMap.set(tipo, {
            quantidade: current.quantidade + quantidade,
            valor_total: current.valor_total + valorProporcional
          });
        });
      });

      // Converter para array e ordenar por valor total
      const resultado: FaturamentoPorProduto[] = Array.from(faturamentoMap.entries())
        .map(([tipo_produto, dados]) => ({
          tipo_produto,
          quantidade: dados.quantidade,
          valor_total: dados.valor_total
        }))
        .sort((a, b) => b.valor_total - a.valor_total);

      return resultado;
    },
    refetchInterval: 120000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
};
