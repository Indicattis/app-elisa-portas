import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EtiquetaCalculo, LinhaResumo } from '@/types/etiqueta';

export const useEtiquetas = () => {
  // Buscar todos os pedidos ativos
  const { data: pedidos = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ['etiquetas-pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_producao')
        .select('id, numero_pedido, cliente_nome, etapa_atual, created_at, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Função para buscar linhas de um pedido específico
  const buscarLinhasPedido = async (pedidoId: string): Promise<LinhaResumo[]> => {
    const { data, error } = await supabase
      .from('pedido_linhas')
      .select('id, pedido_id, nome_produto, descricao_produto, quantidade, largura, altura, tamanho')
      .eq('pedido_id', pedidoId)
      .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  // Função de cálculo de etiquetas
  const calcularEtiquetas = (linha: LinhaResumo): EtiquetaCalculo => {
    const nomeProduto = linha.nome_produto || linha.descricao_produto || 'Item';
    const isMeiaCana = nomeProduto.toLowerCase().includes('meia cana');
    
    if (!isMeiaCana) {
      return {
        linhaId: linha.id,
        nomeProduto,
        quantidade: linha.quantidade,
        etiquetasNecessarias: linha.quantidade,
        tipoCalculo: 'normal',
        explicacao: `Cada unidade recebe 1 etiqueta. Total: ${linha.quantidade} etiqueta(s).`,
        largura: linha.largura || undefined,
        altura: linha.altura || undefined,
      };
    }

    // Para meia canas, verificar dimensões
    const largura = linha.largura || 0;
    const altura = linha.altura || 0;
    const temDimensaoGrande = largura > 6.5 || altura > 6.5;
    
    if (temDimensaoGrande) {
      const etiquetas = Math.ceil(linha.quantidade / 5);
      return {
        linhaId: linha.id,
        nomeProduto,
        quantidade: linha.quantidade,
        etiquetasNecessarias: etiquetas,
        tipoCalculo: 'meia_cana_grande',
        explicacao: `Porta grande (largura ${largura}m ou altura ${altura}m > 6.5m). Quantidade de meia canas (${linha.quantidade}) ÷ 5 = ${etiquetas} etiqueta(s).`,
        largura,
        altura,
      };
    } else {
      const etiquetas = Math.ceil(linha.quantidade / 10);
      return {
        linhaId: linha.id,
        nomeProduto,
        quantidade: linha.quantidade,
        etiquetasNecessarias: etiquetas,
        tipoCalculo: 'meia_cana_pequena',
        explicacao: `Porta pequena (largura ${largura}m e altura ${altura}m ≤ 6.5m). Quantidade de meia canas (${linha.quantidade}) ÷ 10 = ${etiquetas} etiqueta(s).`,
        largura,
        altura,
      };
    }
  };

  return {
    pedidos,
    loadingPedidos,
    buscarLinhasPedido,
    calcularEtiquetas,
  };
};
