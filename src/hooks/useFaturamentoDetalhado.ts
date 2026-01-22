import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DetalheItem {
  id: string;
  nome: string;
  quantidade: number;
  valor_total: number;
  lucro_total: number;
  cor_hex?: string;
}

interface FaturamentoDetalhado {
  tipo_produto: string;
  quantidade: number;
  valor_total: number;
  lucro_total: number;
  detalhes: DetalheItem[];
}

interface UseFaturamentoDetalhadoParams {
  dateRange?: DateRange;
  selectedAtendente?: string;
  filterPublico?: string;
}

export const useFaturamentoDetalhado = ({ 
  dateRange, 
  selectedAtendente = 'todos',
  filterPublico = 'todos'
}: UseFaturamentoDetalhadoParams = {}) => {
  return useQuery({
    queryKey: ['faturamento-detalhado', dateRange, selectedAtendente, filterPublico],
    queryFn: async () => {
      // Buscar todas as vendas com produtos detalhados
      let query = supabase
        .from('vendas')
        .select(`
          id,
          data_venda,
          valor_venda,
          valor_frete,
          atendente_id,
          publico_alvo,
          produtos_vendas(
            id,
            tipo_produto,
            quantidade,
            lucro_item,
            faturamento,
            descricao,
            cor_id,
            acessorio_id,
            adicional_id
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
      if (error) throw error;

      // Buscar dados auxiliares
      const [{ data: acessorios }, { data: adicionais }, { data: cores }] = await Promise.all([
        supabase.from('acessorios').select('id, nome'),
        supabase.from('adicionais').select('id, nome'),
        supabase.from('catalogo_cores').select('id, nome, codigo_hex')
      ]);

      const acessoriosMap = new Map(acessorios?.map(a => [a.id, a.nome]) || []);
      const adicionaisMap = new Map(adicionais?.map(a => [a.id, a.nome]) || []);
      const coresMap = new Map(cores?.map(c => [c.id, { nome: c.nome, hex: c.codigo_hex }]) || []);

      // Estrutura para agrupar por tipo e detalhes
      const faturamentoMap = new Map<string, {
        quantidade: number;
        valor_total: number;
        lucro_total: number;
        detalhesMap: Map<string, DetalheItem>;
      }>();

      vendas?.forEach((venda: any) => {
        const produtos = venda.produtos_vendas || [];
        const valorVenda = Number(venda.valor_venda || 0);
        const valorFrete = Number(venda.valor_frete || 0);
        const valorSemFrete = valorVenda - valorFrete;
        
        if (produtos.length === 0) return;
        
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
          
          // Determinar o nome do detalhe baseado no tipo
          let detalheId = '';
          let detalheNome = '';
          let corHex = '';
          
          if (tipo === 'acessorios' || tipo === 'acessorio') {
            detalheId = produto.acessorio_id || 'sem_id';
            detalheNome = produto.acessorio_id ? (acessoriosMap.get(produto.acessorio_id) || 'Acessório não encontrado') : 'Acessório sem nome';
          } else if (tipo === 'adicionais' || tipo === 'adicional') {
            detalheId = produto.adicional_id || 'sem_id';
            detalheNome = produto.adicional_id ? (adicionaisMap.get(produto.adicional_id) || 'Adicional não encontrado') : 'Adicional sem nome';
          } else if (tipo === 'manutencao') {
            detalheId = produto.descricao || 'sem_descricao';
            detalheNome = produto.descricao || 'Sem descrição';
          } else if (tipo === 'pintura_epoxi') {
            const corInfo = produto.cor_id ? coresMap.get(produto.cor_id) : null;
            detalheId = produto.cor_id || 'sem_cor';
            detalheNome = corInfo?.nome || 'Cor não especificada';
            corHex = corInfo?.hex || '';
          } else {
            // Para outros tipos, não tem detalhes expandíveis
            detalheId = tipo;
            detalheNome = tipo;
          }
          
          // Inicializar tipo se não existe
          if (!faturamentoMap.has(tipo)) {
            faturamentoMap.set(tipo, {
              quantidade: 0,
              valor_total: 0,
              lucro_total: 0,
              detalhesMap: new Map()
            });
          }
          
          const tipoData = faturamentoMap.get(tipo)!;
          tipoData.quantidade += quantidade;
          tipoData.valor_total += valorProporcional;
          tipoData.lucro_total += lucroItem;
          
          // Adicionar detalhe
          const detalheAtual = tipoData.detalhesMap.get(detalheId) || {
            id: detalheId,
            nome: detalheNome,
            quantidade: 0,
            valor_total: 0,
            lucro_total: 0,
            cor_hex: corHex
          };
          
          detalheAtual.quantidade += quantidade;
          detalheAtual.valor_total += valorProporcional;
          detalheAtual.lucro_total += lucroItem;
          if (corHex) detalheAtual.cor_hex = corHex;
          
          tipoData.detalhesMap.set(detalheId, detalheAtual);
        });
      });

      // Converter para array e ordenar
      const resultado: FaturamentoDetalhado[] = Array.from(faturamentoMap.entries())
        .map(([tipo_produto, dados]) => ({
          tipo_produto,
          quantidade: dados.quantidade,
          valor_total: dados.valor_total,
          lucro_total: dados.lucro_total,
          detalhes: Array.from(dados.detalhesMap.values())
            .sort((a, b) => b.quantidade - a.quantidade)
        }))
        .sort((a, b) => b.valor_total - a.valor_total);

      return resultado;
    },
    refetchInterval: 120000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
};
