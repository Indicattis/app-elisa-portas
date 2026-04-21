import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { calcularFaturamentoLiquido, isVendaValida } from '@/utils/faturamentoCalc';

interface FaturamentoPorProduto {
  tipo_produto: string;
  quantidade: number;
  valor_total: number;
  lucro_total: number;
}

interface UseFaturamentoPorProdutoParams {
  dateRange?: DateRange;
  selectedAtendente?: string;
  filterPublico?: string;
}

export const useFaturamentoPorProduto = ({ 
  dateRange, 
  selectedAtendente = 'todos',
  filterPublico = 'todos'
}: UseFaturamentoPorProdutoParams = {}) => {
  return useQuery({
    queryKey: ['faturamento-por-produto', dateRange, selectedAtendente, filterPublico],
    queryFn: async () => {
      // Buscar todas as vendas com seus produtos
      let query = supabase
        .from('vendas')
        .select(`
          id,
          data_venda,
          valor_venda,
          valor_frete,
          valor_credito,
          atendente_id,
          publico_alvo,
          produtos_vendas(
            tipo_produto,
            quantidade,
            lucro_item,
            faturamento
          )
        `)
        .order('data_venda', { ascending: false });

      // Aplicar filtro de data
      if (dateRange?.from && dateRange?.to) {
        const startDate = format(dateRange.from, 'yyyy-MM-dd');
        const endDate = format(dateRange.to, 'yyyy-MM-dd');
        query = query
          .gte('data_venda', startDate + ' 00:00:00')
          .lte('data_venda', endDate + ' 23:59:59');
      }

      // Aplicar filtro de atendente
      if (selectedAtendente !== 'todos') {
        query = query.eq('atendente_id', selectedAtendente);
      }

      // Aplicar filtro de público
      if (filterPublico !== 'todos') {
        query = query.eq('publico_alvo', filterPublico);
      }

      const { data: vendas, error } = await query;

      if (error) {
        console.error('Erro ao buscar faturamento por produto:', error);
        throw error;
      }

      // Agrupar por tipo de produto
      const faturamentoMap = new Map<string, { quantidade: number; valor_total: number; lucro_total: number }>();

      vendas?.forEach((venda: any) => {
        if (!isVendaValida(venda)) return;
        const produtos = venda.produtos_vendas || [];
        const valorSemFrete = calcularFaturamentoLiquido(venda);
        
        // Se não há produtos, não contabilizar
        if (produtos.length === 0) return;
        
        // Filtrar produtos faturados (faturamento = true)
        const produtosFaturados = produtos.filter((p: any) => p.faturamento === true);
        const totalQuantidade = produtos.reduce((sum: number, p: any) => sum + (p.quantidade || 0), 0);
        
        produtos.forEach((produto: any) => {
          const tipo = produto.tipo_produto || 'Sem tipo';
          const quantidade = produto.quantidade || 0;
          
          // Valor proporcional baseado na quantidade
          const valorProporcional = totalQuantidade > 0 
            ? (quantidade / totalQuantidade) * valorSemFrete 
            : valorSemFrete / produtos.length;
          
          // Lucro vem do lucro_item apenas se produto está faturado
          const lucroItem = produto.faturamento === true ? (produto.lucro_item || 0) : 0;
          
          const current = faturamentoMap.get(tipo) || { quantidade: 0, valor_total: 0, lucro_total: 0 };
          faturamentoMap.set(tipo, {
            quantidade: current.quantidade + quantidade,
            valor_total: current.valor_total + valorProporcional,
            lucro_total: current.lucro_total + lucroItem
          });
        });
      });

      // Converter para array e ordenar por valor total
      const resultado: FaturamentoPorProduto[] = Array.from(faturamentoMap.entries())
        .map(([tipo_produto, dados]) => ({
          tipo_produto,
          quantidade: dados.quantidade,
          valor_total: dados.valor_total,
          lucro_total: dados.lucro_total
        }))
        .sort((a, b) => b.valor_total - a.valor_total);

      return resultado;
    },
    refetchInterval: 120000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
};
