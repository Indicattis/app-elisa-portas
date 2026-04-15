import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isVendaFaturada } from "@/lib/faturamentoStatus";

export interface VendaPendenteFaturamento {
  id: string;
  data_venda: string;
  cliente_nome: string | null;
  valor_venda: number;
  atendente_nome: string | null;
  atendente_foto_url: string | null;
  cidade: string | null;
  estado: string | null;
  quantidade_portas: number;
}

export const useVendasPendenteFaturamento = () => {
  return useQuery({
    queryKey: ["vendas-pendente-faturamento"],
    queryFn: async (): Promise<VendaPendenteFaturamento[]> => {
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;

      const { data: vendas, error } = await supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          cliente_nome,
          valor_venda,
          frete_aprovado,
          status_aprovacao,
          is_rascunho,
          atendente_id,
          cidade,
          estado,
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
        .eq("pedido_dispensado", false)
        .gte("data_venda", startOfYear)
        .order("data_venda", { ascending: false });

      if (error) throw error;
      if (!vendas) return [];

      // Fetch atendentes
      const { data: usuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url");

      const atendenteMap = new Map<string, { nome: string; foto: string | null }>();
      if (usuarios) {
        usuarios.forEach((u) => atendenteMap.set(u.user_id, { nome: u.nome, foto: u.foto_perfil_url }));
      }

      // Filter: NOT faturada + no pedido + not reprovado
      return vendas
        .filter((v: any) => {
          if (v.status_aprovacao === "reprovado") return false;
          if (isVendaFaturada(v)) return false; // inverted: only non-billed
          const pedidos = v.pedidos_producao || [];
          if (pedidos.length > 0) return false;
          return true;
        })
        .map((v: any) => {
          const produtos = v.produtos_vendas || [];
          const portas = produtos.filter((p: any) => p.tipo_produto === "porta_enrolar");
          const qtdPortas = portas.reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);

          return {
            id: v.id,
            data_venda: v.data_venda,
            cliente_nome: v.cliente_nome,
            valor_venda: v.valor_venda || 0,
            atendente_nome: v.atendente_id
              ? atendenteMap.get(v.atendente_id)?.nome || null
              : null,
            atendente_foto_url: v.atendente_id
              ? atendenteMap.get(v.atendente_id)?.foto || null
              : null,
            cidade: v.cidade || null,
            estado: v.estado || null,
            quantidade_portas: qtdPortas,
          };
        });
    },
    refetchInterval: 30000,
  });
};
