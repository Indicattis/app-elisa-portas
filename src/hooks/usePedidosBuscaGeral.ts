import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface PedidoBuscaGeral {
  id: string;
  numero_pedido: string;
  etapa_atual: string;
  created_at: string;
  prioridade_etapa: number;
  data_carregamento?: string;
  vendas?: {
    id: string;
    cliente_nome: string;
    cliente_telefone?: string;
    cpf_cnpj?: string;
    valor_venda?: number;
    tipo_entrega?: string;
    atendente?: {
      nome: string;
      foto_perfil_url?: string;
    };
    produtos_vendas?: Array<{
      tipo_produto?: string;
      quantidade?: number;
      cor_id?: string;
      catalogo_cores?: {
        nome: string;
      };
    }>;
  };
}

export function usePedidosBuscaGeral(searchTerm: string) {
  const { data: pedidos, isLoading, error } = useQuery({
    queryKey: ['pedidos-busca-geral', searchTerm],
    queryFn: async () => {
      // Buscar todos os pedidos não arquivados com dados da venda
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select(`
          id,
          numero_pedido,
          etapa_atual,
          created_at,
          prioridade_etapa,
          data_carregamento,
          vendas:venda_id (
            id,
            cliente_nome,
            cliente_telefone,
            cpf_cnpj,
            valor_venda,
            tipo_entrega,
            atendente:atendente_id (
              nome,
              foto_perfil_url
            ),
            produtos_vendas (
              tipo_produto,
              quantidade,
              cor_id,
              catalogo_cores:cor_id (
                nome
              )
            )
          )
        `)
        .eq("arquivado", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PedidoBuscaGeral[];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30000, // 30 segundos
  });

  // Filtrar resultados no cliente para busca flexível
  const pedidosFiltrados = useMemo(() => {
    if (!pedidos || !searchTerm || searchTerm.length < 2) return [];
    
    const termLower = searchTerm.toLowerCase().trim();
    
    return pedidos.filter(pedido => {
      // Buscar por número do pedido
      if (pedido.numero_pedido?.toLowerCase().includes(termLower)) {
        return true;
      }
      
      // Buscar por nome do cliente
      const clienteNome = pedido.vendas?.cliente_nome?.toLowerCase() || '';
      if (clienteNome.includes(termLower)) {
        return true;
      }
      
      // Buscar por CPF/CNPJ (removendo pontuação)
      const cpfCnpj = pedido.vendas?.cpf_cnpj?.replace(/\D/g, '') || '';
      const termSemPontuacao = termLower.replace(/\D/g, '');
      if (cpfCnpj.includes(termSemPontuacao) && termSemPontuacao.length >= 3) {
        return true;
      }
      
      // Buscar por telefone
      const telefone = pedido.vendas?.cliente_telefone?.replace(/\D/g, '') || '';
      if (telefone.includes(termSemPontuacao) && termSemPontuacao.length >= 3) {
        return true;
      }
      
      return false;
    });
  }, [pedidos, searchTerm]);

  return {
    pedidos: pedidosFiltrados,
    isLoading,
    error,
    totalEncontrados: pedidosFiltrados.length,
  };
}
