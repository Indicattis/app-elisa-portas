import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface PedidoBuscaGeral {
  id: string;
  numero_pedido: string;
  numero_mes?: number;
  mes_vigencia?: string;
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
    created_at?: string;
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
      tipo_fabricacao?: string;
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
  backlog?: Array<{
    motivo_backlog?: string;
    data_backlog?: string;
  }>;
  tem_historico_backlog?: boolean;
  ordens?: any;
}

export function usePedidosBuscaGeral(searchTerm: string) {
  // Normalizar termo para case-insensitive
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  const { data: pedidos, isLoading, error } = useQuery({
    queryKey: ['pedidos-busca-geral', normalizedSearch],
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
            created_at,
            atendente:admin_users!fk_vendas_atendente (
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
              tipo_fabricacao,
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
      
      // Buscar ordens de produção para cada pedido
      const pedidosComOrdens = await Promise.all(
        (data || []).map(async (pedido: any) => {
          // Buscar status das ordens de produção
          const [soldagem, perfiladeira, separacao, qualidade, pintura] = await Promise.all([
            supabase
              .from('ordens_soldagem')
              .select('id, status, responsavel_id')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_perfiladeira')
              .select('id, status, responsavel_id')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_separacao')
              .select('id, status, responsavel_id')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_qualidade')
              .select('id, status, responsavel_id')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
            supabase
              .from('ordens_pintura')
              .select('id, status, responsavel_id')
              .eq('pedido_id', pedido.id)
              .maybeSingle(),
          ]);

          // Função auxiliar para buscar foto do responsável
          const fetchResponsavelFoto = async (responsavelId: string | null): Promise<string | null> => {
            if (!responsavelId) return null;
            const { data } = await supabase
              .from('admin_users')
              .select('foto_perfil_url')
              .eq('user_id', responsavelId)
              .maybeSingle();
            return data?.foto_perfil_url || null;
          };

          const buildOrdemStatus = async (result: any) => {
            const responsavelId = result.data?.responsavel_id || null;
            const foto = await fetchResponsavelFoto(responsavelId);
            
            return {
              existe: !!result.data,
              ordem_id: result.data?.id || null,
              status: result.data?.status || null,
              capturada: !!responsavelId,
              capturada_por_foto: foto,
            };
          };

          const [ordemSoldagem, ordemPerfiladeira, ordemSeparacao, ordemQualidade, ordemPintura] = await Promise.all([
            buildOrdemStatus(soldagem),
            buildOrdemStatus(perfiladeira),
            buildOrdemStatus(separacao),
            buildOrdemStatus(qualidade),
            buildOrdemStatus(pintura),
          ]);

          return {
            ...pedido,
            ordens: {
              soldagem: ordemSoldagem,
              perfiladeira: ordemPerfiladeira,
              separacao: ordemSeparacao,
              qualidade: ordemQualidade,
              pintura: ordemPintura,
            }
          };
        })
      );

      return pedidosComOrdens as unknown as PedidoBuscaGeral[];
    },
    staleTime: 30000, // 30 segundos
  });

  // Filtrar resultados no cliente para busca flexível
  const pedidosFiltrados = useMemo(() => {
    if (!pedidos) return [];
    
    // Se não há termo de busca, retorna todos
    if (!normalizedSearch || normalizedSearch.length < 2) {
      return pedidos;
    }
    
    const termLower = normalizedSearch;
    
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
  }, [pedidos, normalizedSearch]);

  return {
    pedidos: pedidosFiltrados,
    isLoading,
    error,
    totalEncontrados: pedidosFiltrados.length,
  };
}
