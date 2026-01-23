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
  arquivado?: boolean;
  vendas?: {
    id: string;
    cliente_nome: string;
    cliente_telefone?: string;
    cpf_cliente?: string;
    valor_venda?: number;
    tipo_entrega?: string;
    cidade?: string;
    estado?: string;
    atendente?: {
      nome: string;
      foto_perfil_url?: string;
    };
    produtos_vendas?: Array<{
      id?: string;
      tipo_produto?: string;
      quantidade?: number;
      valor_pintura?: number;
      largura?: number;
      altura?: number;
      tamanho?: string;
      cor?: {
        nome: string;
        codigo_hex?: string;
      };
    }>;
  };
  pedidos_etapas?: Array<{
    id: string;
    etapa: string;
    data_entrada: string;
    data_saida?: string;
    checkboxes?: any;
  }>;
}

export function usePedidosBuscaGeral(searchTerm: string) {
  const { data: pedidos, isLoading, error } = useQuery({
    queryKey: ['pedidos-busca-geral', searchTerm],
    queryFn: async () => {
      // Buscar todos os pedidos não arquivados com dados da venda
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select(`
          *,
          vendas:venda_id (
            id,
            cliente_nome,
            cliente_telefone,
            cpf_cliente,
            valor_venda,
            tipo_entrega,
            cidade,
            estado,
            atendente:atendente_id (
              nome,
              foto_perfil_url
            ),
            produtos_vendas (
              id,
              tipo_produto,
              quantidade,
              valor_pintura,
              largura,
              altura,
              tamanho,
              cor:catalogo_cores (
                nome,
                codigo_hex
              )
            )
          ),
          pedidos_etapas (*)
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
      
      // Buscar por CPF (removendo pontuação)
      const termSemPontuacao = termLower.replace(/\D/g, '');
      const cpfCliente = pedido.vendas?.cpf_cliente?.replace(/\D/g, '') || '';
      if (termSemPontuacao.length >= 3 && cpfCliente.includes(termSemPontuacao)) {
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
