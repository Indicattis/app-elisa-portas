import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PedidoLinha {
  id: string;
  pedido_id: string;
  estoque_id: string | null;
  nome_produto: string;
  descricao_produto: string | null;
  quantidade: number;
  ordem: number;
  tamanho: string | null;
}

export interface PedidoLinhaNova {
  estoque_id?: string;
  nome_produto: string;
  descricao_produto?: string;
  quantidade: number;
  tamanho?: string;
}

export interface Pedido {
  id: string;
  numero_pedido: string;
  venda_id: string;
  status: string;
  status_preenchimento: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  cliente_cpf: string | null;
  cliente_bairro: string | null;
  data_entrega: string | null;
  observacoes: string | null;
  observacoes_venda: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  forma_pagamento: string | null;
  valor_venda: number | null;
  valor_entrada: number | null;
  numero_parcelas: number | null;
  modalidade_instalacao: string | null;
  valor_frete: number | null;
  valor_instalacao: number | null;
  created_at: string;
  updated_at: string;
  pedido_linhas?: PedidoLinha[];
}

export interface Venda {
  id: string;
  cliente_nome: string;
  cliente_telefone: string;
  valor_venda: number;
  created_at: string;
  pedidos_producao?: Pedido[];
  produtos_vendas?: any[];
}

export const useVendasPedidos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVendaId, setSelectedVendaId] = useState<string | null>(null);

  // Buscar todas as vendas
  const { data: vendas = [], isLoading: vendasLoading } = useQuery({
    queryKey: ["vendas-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select(`
          id,
          cliente_nome,
          cliente_telefone,
          valor_venda,
          created_at,
          pedidos_producao!left(id, status, status_preenchimento),
          produtos_vendas(tipo_produto, cor:catalogo_cores(nome, codigo_hex))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  // Buscar pedido completo da venda selecionada
  const { data: pedidoAtual, isLoading: pedidoLoading } = useQuery({
    queryKey: ["pedido-venda", selectedVendaId],
    queryFn: async () => {
      if (!selectedVendaId) return null;

      const { data, error } = await supabase
        .from("pedidos_producao")
        .select(`
          *,
          pedido_linhas(*)
        `)
        .eq("venda_id", selectedVendaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Pedido | null;
    },
    enabled: !!selectedVendaId,
  });

  // Buscar ordens de produção do pedido
  const { data: ordens = [], isLoading: ordensLoading } = useQuery({
    queryKey: ["ordens-pedido", pedidoAtual?.id],
    queryFn: async () => {
      if (!pedidoAtual?.id) return [];

      const [perfiladeira, separacao, soldagem, pintura] = await Promise.all([
        supabase.from("ordens_perfiladeira").select("*").eq("pedido_id", pedidoAtual.id),
        supabase.from("ordens_separacao").select("*").eq("pedido_id", pedidoAtual.id),
        supabase.from("ordens_soldagem").select("*").eq("pedido_id", pedidoAtual.id),
        supabase.from("ordens_pintura").select("*").eq("pedido_id", pedidoAtual.id),
      ]);

      const todasOrdens = [
        ...(perfiladeira.data || []).map(o => ({ ...o, tipo: "perfiladeira" })),
        ...(separacao.data || []).map(o => ({ ...o, tipo: "separacao" })),
        ...(soldagem.data || []).map(o => ({ ...o, tipo: "soldagem" })),
        ...(pintura.data || []).map(o => ({ ...o, tipo: "pintura" })),
      ];

      return todasOrdens;
    },
    enabled: !!pedidoAtual?.id,
  });

  // Criar pedido principal
  const criarPedidoPrincipal = useMutation({
    mutationFn: async (vendaId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: venda } = await supabase
        .from("vendas")
        .select("cliente_nome, cliente_telefone")
        .eq("id", vendaId)
        .single();

      if (!venda) throw new Error("Venda não encontrada");

      // Gerar número do pedido com timestamp para garantir unicidade
      const { data: numeroData, error: rpcError } = await supabase.rpc("gerar_proximo_numero", {
        tipo_documento: "pedido_producao",
      });

      if (rpcError) throw rpcError;

      const timestamp = Date.now().toString().slice(-6);
      const numeroPedido = `PP-${numeroData}-${timestamp}`;

      const { data, error } = await supabase
        .from("pedidos_producao")
        .insert([{
          venda_id: vendaId,
          numero_pedido: numeroPedido,
          cliente_nome: venda.cliente_nome,
          cliente_telefone: venda.cliente_telefone,
          status: "pendente",
          status_preenchimento: "pendente",
          created_by: userData?.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedido-venda"] });
      toast({
        title: "Pedido criado",
        description: "Pedido principal criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Adicionar linha ao pedido
  const adicionarLinha = useMutation({
    mutationFn: async ({ pedidoId, linha }: { pedidoId: string; linha: PedidoLinhaNova }) => {
      const { data: linhasExistentes } = await supabase
        .from("pedido_linhas")
        .select("ordem")
        .eq("pedido_id", pedidoId)
        .order("ordem", { ascending: false })
        .limit(1);

      const proximaOrdem = linhasExistentes?.[0]?.ordem ?? -1;

      const { data, error } = await supabase
        .from("pedido_linhas")
        .insert({
          pedido_id: pedidoId,
          ...linha,
          ordem: proximaOrdem + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-venda"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar linha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remover linha do pedido
  const removerLinha = useMutation({
    mutationFn: async (linhaId: string) => {
      const { error } = await supabase
        .from("pedido_linhas")
        .delete()
        .eq("id", linhaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-venda"] });
      toast({
        title: "Linha removida",
        description: "Linha do pedido removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover linha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar checkbox de linha
  const atualizarCheckbox = useMutation({
    mutationFn: async ({ linhaId, campo, valor }: { linhaId: string; campo: string; valor: boolean }) => {
      const { error } = await supabase
        .from("pedido_linhas")
        .update({ [campo]: valor })
        .eq("id", linhaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-venda"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Confirmar preenchimento do pedido
  const confirmarPreenchimento = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { error } = await supabase
        .from("pedidos_producao")
        .update({ status_preenchimento: "preenchido" })
        .eq("id", pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-venda"] });
      queryClient.invalidateQueries({ queryKey: ["vendas-pedidos"] });
      toast({
        title: "Pedido confirmado",
        description: "Pedido preenchido e pronto para gerar ordens!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gerar ordens de produção
  const gerarOrdens = useMutation({
    mutationFn: async ({ pedidoId, tipos }: { pedidoId: string; tipos: string[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      const ordemPromises = tipos.map(async (tipo) => {
        const numeroOrdem = `${pedidoId.slice(0, 8)}-${tipo.toUpperCase().substring(0, 3)}`;
        
        let tableName = "";
        if (tipo === "perfiladeira") tableName = "ordens_perfiladeira";
        else if (tipo === "separacao") tableName = "ordens_separacao";
        else if (tipo === "soldagem") tableName = "ordens_soldagem";
        else if (tipo === "pintura") tableName = "ordens_pintura";

        const { error } = await supabase
          .from(tableName as any)
          .insert({
            pedido_id: pedidoId,
            numero_ordem: numeroOrdem,
            status: "pendente",
            created_by: userData?.user?.id,
          });

        if (error) throw error;
      });

      await Promise.all(ordemPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-pedido"] });
      toast({
        title: "Ordens geradas",
        description: "Ordens de produção geradas com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar ordens",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Concluir ordem de produção
  const concluirOrdem = useMutation({
    mutationFn: async ({ ordemId, tipo }: { ordemId: string; tipo: string }) => {
      let tableName = "";
      if (tipo === "perfiladeira") tableName = "ordens_perfiladeira";
      else if (tipo === "separacao") tableName = "ordens_separacao";
      else if (tipo === "soldagem") tableName = "ordens_soldagem";
      else if (tipo === "pintura") tableName = "ordens_pintura";

      const { error } = await supabase
        .from(tableName as any)
        .update({
          status: "concluido",
          data_conclusao: new Date().toISOString(),
          pausada: false,
          pausada_em: null,
          justificativa_pausa: null,
          ...(tipo !== "qualidade" ? { linha_problema_id: null } : {}),
        })
        .eq("id", ordemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-pedido"] });
      toast({
        title: "Ordem concluída",
        description: "Ordem marcada como concluída!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao concluir ordem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Dar baixa no pedido
  const darBaixaPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { error } = await supabase
        .from("pedidos_producao")
        .update({
          status: "concluido",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedido-venda"] });
      queryClient.invalidateQueries({ queryKey: ["vendas-pedidos"] });
      toast({
        title: "Baixa efetuada",
        description: "Pedido finalizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao dar baixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    vendas,
    selectedVendaId,
    setSelectedVendaId,
    pedidoAtual,
    ordens,
    loading: vendasLoading || pedidoLoading || ordensLoading,
    criarPedidoPrincipal: criarPedidoPrincipal.mutateAsync,
    adicionarLinha: adicionarLinha.mutateAsync,
    removerLinha: removerLinha.mutateAsync,
    atualizarCheckbox: atualizarCheckbox.mutateAsync,
    confirmarPreenchimento: confirmarPreenchimento.mutateAsync,
    gerarOrdens: gerarOrdens.mutateAsync,
    concluirOrdem: concluirOrdem.mutateAsync,
    darBaixaPedido: darBaixaPedido.mutateAsync,
  };
};
