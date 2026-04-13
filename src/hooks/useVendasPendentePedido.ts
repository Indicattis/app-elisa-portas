import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isVendaFaturada } from "@/lib/faturamentoStatus";

export interface VendaPendentePedido {
  id: string;
  data_venda: string;
  cliente_nome: string | null;
  valor_venda: number;
  valor_credito: number;
  quantidade_portas: number;
  atendente_nome: string | null;
}

export const useVendasPendentePedido = () => {
  return useQuery({
    queryKey: ["vendas-pendente-pedido"],
    queryFn: async (): Promise<VendaPendentePedido[]> => {
      // Fetch vendas with produtos and check for linked pedidos
      const { data: vendas, error } = await supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          cliente_nome,
          valor_venda,
          valor_credito,
          frete_aprovado,
          status_aprovacao,
          is_rascunho,
          atendente_id,
          produtos_vendas (
            id,
            faturamento,
            quantidade,
            tipo_produto
          ),
          pedidos_producao (
            id
          )
        `)
        .eq("is_rascunho", false)
        .order("data_venda", { ascending: false });

      if (error) throw error;
      if (!vendas) return [];

      // Fetch atendentes
      const { data: usuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome");

      const atendenteMap = new Map<string, string>();
      if (usuarios) {
        usuarios.forEach((u) => atendenteMap.set(u.user_id, u.nome));
      }

      // Filter: faturada + no pedido + not reprovado
      return vendas
        .filter((v: any) => {
          if (v.status_aprovacao === "reprovado") return false;
          if (!isVendaFaturada(v)) return false;
          // No linked pedido
          const pedidos = v.pedidos_producao || [];
          if (pedidos.length > 0) return false;
          return true;
        })
        .map((v: any) => {
          const produtos = v.produtos_vendas || [];
          const portas = produtos.filter(
            (p: any) => p.tipo_produto === "porta_enrolar"
          );
          const qtdPortas = portas.reduce(
            (sum: number, p: any) => sum + (p.quantidade || 1),
            0
          );
          return {
            id: v.id,
            data_venda: v.data_venda,
            cliente_nome: v.cliente_nome,
            valor_venda: v.valor_venda || 0,
            valor_credito: v.valor_credito || 0,
            quantidade_portas: qtdPortas,
            atendente_nome: v.atendente_id
              ? atendenteMap.get(v.atendente_id) || null
              : null,
          };
        });
    },
    refetchInterval: 30000,
  });
};
