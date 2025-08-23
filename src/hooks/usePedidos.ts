import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { gerarProximoNumero, formatarNumeroPedido } from "@/utils/numberingService";

interface Pedido {
  id: string;
  numero_pedido: string;
  orcamento_id?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf?: string;
  cliente_bairro?: string;
  status: string;
  created_at: string;
  data_entrega?: string;
  observacoes?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  valor_venda?: number;
  forma_pagamento?: string;
  modalidade_instalacao?: string;
  produtos: any[];
}

export function usePedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPedidos((data || []).map(pedido => ({
        ...pedido,
        produtos: Array.isArray(pedido.produtos) ? pedido.produtos : []
      })));
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar pedidos",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarPedidoDeOrcamento = async (orcamentoId: string) => {
    try {
      // Buscar dados do orçamento
      const { data: orcamento, error: orcamentoError } = await supabase
        .from("orcamentos")
        .select(`
          *,
          orcamento_produtos:orcamento_produtos(*)
        `)
        .eq("id", orcamentoId)
        .single();

      if (orcamentoError) throw orcamentoError;

      // Gerar próximo número do pedido
      const proximoNumero = await gerarProximoNumero('pedido');
      const numeroPedido = formatarNumeroPedido(proximoNumero);

      // Criar pedido com dados do orçamento
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos_producao")
        .insert({
          numero_pedido: numeroPedido,
          orcamento_id: orcamento.id,
          cliente_nome: orcamento.cliente_nome,
          cliente_telefone: orcamento.cliente_telefone,
          cliente_email: orcamento.cliente_email,
          cliente_cpf: orcamento.cliente_cpf,
          cliente_bairro: orcamento.cliente_bairro,
          endereco_rua: orcamento.cliente_estado, // Ajustar conforme estrutura real
          endereco_cidade: orcamento.cliente_cidade,
          endereco_estado: orcamento.cliente_estado,
          endereco_cep: orcamento.cliente_cep,
          forma_pagamento: orcamento.forma_pagamento,
          valor_venda: orcamento.valor_total,
          valor_frete: orcamento.valor_frete,
          valor_instalacao: orcamento.valor_instalacao,
          modalidade_instalacao: orcamento.modalidade_instalacao,
          produtos: orcamento.orcamento_produtos || [],
          status: 'pendente'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      toast({
        title: "Sucesso",
        description: `Pedido ${numeroPedido} criado com sucesso`,
      });

      await fetchPedidos();
      return pedido;
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar pedido do orçamento",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  return {
    pedidos,
    loading,
    fetchPedidos,
    criarPedidoDeOrcamento,
  };
}