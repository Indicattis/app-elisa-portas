import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrdemStatus {
  existe: boolean;
  status: string | null;
  capturada: boolean;
  capturada_por_foto?: string | null;
  pausada: boolean;
  justificativa_pausa?: string | null;
}

interface ProdutoInfo {
  tipo: string;
  descricao: string | null;
  tamanho: string | null;
  quantidade: number;
}

interface PedidoComOrdens {
  numero_pedido: string;
  numero_mes: number | null;
  etapa_atual: string;
  nome_cliente: string;
  data_entrega: string | null;
  data_carregamento: string | null;
  prioridade: number;
  produtos: ProdutoInfo[];
  ordens: {
    soldagem: OrdemStatus;
    perfiladeira: OrdemStatus;
    separacao: OrdemStatus;
    qualidade: OrdemStatus;
    pintura: OrdemStatus;
  };
}

export function usePedidosComOrdens() {
  return useQuery({
    queryKey: ["pedidos-com-ordens"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pedidos_com_status_ordens");
      
      if (error) {
        console.error("Erro ao buscar pedidos com ordens:", error);
        return [];
      }
      
      // Transform the flat RPC response into nested structure
      return (data || []).map((row: any) => ({
        numero_pedido: row.numero_pedido,
        numero_mes: row.numero_mes,
        etapa_atual: row.etapa_atual,
        nome_cliente: row.nome_cliente,
        data_entrega: row.data_entrega,
        data_carregamento: row.data_carregamento,
        prioridade: row.prioridade,
        produtos: row.produtos_lista || [],
        ordens: {
          soldagem: {
            existe: row.soldagem_existe,
            status: row.soldagem_status,
            capturada: row.soldagem_capturada,
            capturada_por_foto: row.soldagem_capturada_por_foto,
            pausada: row.soldagem_pausada || false,
            justificativa_pausa: row.soldagem_justificativa_pausa,
          },
          perfiladeira: {
            existe: row.perfiladeira_existe,
            status: row.perfiladeira_status,
            capturada: row.perfiladeira_capturada,
            capturada_por_foto: row.perfiladeira_capturada_por_foto,
            pausada: row.perfiladeira_pausada || false,
            justificativa_pausa: row.perfiladeira_justificativa_pausa,
          },
          separacao: {
            existe: row.separacao_existe,
            status: row.separacao_status,
            capturada: row.separacao_capturada,
            capturada_por_foto: row.separacao_capturada_por_foto,
            pausada: row.separacao_pausada || false,
            justificativa_pausa: row.separacao_justificativa_pausa,
          },
          qualidade: {
            existe: row.qualidade_existe,
            status: row.qualidade_status,
            capturada: row.qualidade_capturada,
            capturada_por_foto: row.qualidade_capturada_por_foto,
            pausada: row.qualidade_pausada || false,
            justificativa_pausa: row.qualidade_justificativa_pausa,
          },
          pintura: {
            existe: row.pintura_existe,
            status: row.pintura_status,
            capturada: row.pintura_capturada,
            capturada_por_foto: row.pintura_capturada_por_foto,
            pausada: row.pintura_pausada || false,
            justificativa_pausa: row.pintura_justificativa_pausa,
          },
        },
      })) as PedidoComOrdens[];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
