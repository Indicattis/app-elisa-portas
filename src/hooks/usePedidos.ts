import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { gerarProximoNumero, formatarNumeroPedido } from "@/utils/numberingService";

interface Produto {
  id?: string;
  tipo_produto?: string;
  descricao?: string;
  cor?: string;
  medidas?: string;
  quantidade?: number;
  valor?: number;
  [key: string]: any;
}

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
  produtos: Produto[];
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
        produtos: Array.isArray(pedido.produtos) ? pedido.produtos as Produto[] : []
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

  // Função para criar ordens automaticamente para um pedido
  const criarOrdensAutomaticamente = async (pedidoId: string, produtos: Produto[]) => {
    const tiposOrdem = ['separacao', 'perfiladeira', 'soldagem', 'pintura'];
    
    for (const tipoOrdem of tiposOrdem) {
      // Calcular quantas ordens são necessárias
      const ordensNecessarias = calcularOrdensNecessarias(produtos, tipoOrdem);
      
      if (ordensNecessarias > 0) {
        // Criar as linhas iniciais para cada ordem
        for (let i = 0; i < ordensNecessarias; i++) {
          const { error } = await supabase
            .from('linhas_ordens')
            .insert({
              pedido_id: pedidoId,
              tipo_ordem: tipoOrdem,
              item: `Item ${i + 1}`,
              quantidade: 1,
              tamanho: ''
            });
          
          if (error) {
            console.error(`Erro ao criar linha da ordem ${tipoOrdem}:`, error);
          }
        }
      }
    }
  };

  const criarPedidoDeOrcamento = async (orcamentoId: string) => {
    try {
      // Verificar se já existe pedido para este orçamento
      const { data: pedidoExistente, error: verificacaoError } = await supabase
        .from("pedidos_producao")
        .select("id, numero_pedido")
        .eq("orcamento_id", orcamentoId)
        .single();

      if (verificacaoError && verificacaoError.code !== 'PGRST116') {
        throw verificacaoError;
      }

      if (pedidoExistente) {
        toast({
          variant: "destructive",
          title: "Pedido já existe",
          description: `Já existe o pedido ${pedidoExistente.numero_pedido} para este orçamento`,
        });
        return null;
      }

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

      const produtosPedido = orcamento.orcamento_produtos || [];

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
          produtos: produtosPedido,
          status: 'pendente',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Criar ordens automaticamente
      await criarOrdensAutomaticamente(pedido.id, produtosPedido);

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

  const criarOrdemProducao = async (pedidoId: string, tipoOrdem: string, pedidoNumero: string, produtoIndex?: number) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Buscar dados do pedido para copiar produtos
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos_producao")
        .select("produtos")
        .eq("id", pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      const produtos = Array.isArray(pedido.produtos) ? pedido.produtos as Produto[] : [];
      
      // Se produtoIndex for fornecido, criar ordem para produto específico
      // Se não, criar ordens para todos os produtos
      const produtosParaOrdem = produtoIndex !== undefined 
        ? [produtos[produtoIndex]]
        : produtos;

      const ordensCreated = [];

      for (let i = 0; i < produtosParaOrdem.length; i++) {
        const produto = produtosParaOrdem[i];
        const quantidade = produto?.quantidade || 1;
        
        // Criar ordem(s) baseada na quantidade do produto
        for (let j = 0; j < quantidade; j++) {
          const numeroSequencial = produtoIndex !== undefined 
            ? `${produtoIndex + 1}-${j + 1}`
            : `${i + 1}-${j + 1}`;
          const numeroOrdem = `${pedidoNumero}-${tipoOrdem.toUpperCase()}-${numeroSequencial}`;

          let ordem;
          let ordemError;

          const produtoIndividual = { ...produto, quantidade: 1 };

          // Criar ordem específica baseada no tipo
          if (tipoOrdem === 'soldagem') {
            const { data, error } = await supabase
              .from("ordens_soldagem")
              .insert({
                pedido_id: pedidoId,
                numero_ordem: numeroOrdem,
                status: 'pendente_preenchimento',
                produtos: [produtoIndividual],
                created_by: user.user.id
              })
              .select()
              .single();
            ordem = data;
            ordemError = error;
          } else if (tipoOrdem === 'pintura') {
            const { data, error } = await supabase
              .from("ordens_pintura")
              .insert({
                pedido_id: pedidoId,
                numero_ordem: numeroOrdem,
                status: 'pendente_preenchimento',
                produtos: [produtoIndividual],
                cor_principal: '',
                tipo_tinta: '',
                created_by: user.user.id
              })
              .select()
              .single();
            ordem = data;
            ordemError = error;
          } else if (tipoOrdem === 'separacao') {
            const { data, error } = await supabase
              .from("ordens_separacao")
              .insert({
                pedido_id: pedidoId,
                numero_ordem: numeroOrdem,
                status: 'pendente_preenchimento',
                produtos: [produtoIndividual],
                materiais_separados: [],
                created_by: user.user.id
              })
              .select()
              .single();
            ordem = data;
            ordemError = error;
          } else if (tipoOrdem === 'perfiladeira') {
            const { data, error } = await supabase
              .from("ordens_perfiladeira")
              .insert({
                pedido_id: pedidoId,
                numero_ordem: numeroOrdem,
                status: 'pendente_preenchimento',
                produtos: [produtoIndividual],
                perfis_produzidos: [],
                created_by: user.user.id
              })
              .select()
              .single();
            ordem = data;
            ordemError = error;
          } else if (tipoOrdem === 'instalacao') {
            const { data, error } = await supabase
              .from("ordens_instalacao")
              .insert({
                pedido_id: pedidoId,
                numero_ordem: numeroOrdem,
                status: 'pendente_preenchimento',
                produtos: [produtoIndividual],
                endereco_instalacao: '',
                equipe_instalacao: '',
                created_by: user.user.id
              })
              .select()
              .single();
            ordem = data;
            ordemError = error;
          }

          if (ordemError) throw ordemError;
          ordensCreated.push(ordem);
        }
      }

      const totalOrdens = ordensCreated.length;
      toast({
        title: "Sucesso",
        description: `${totalOrdens} ordem(s) de ${tipoOrdem} criada(s) com sucesso`,
      });

      return ordensCreated;
    } catch (error) {
      console.error("Erro ao criar ordem:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao criar ordem de ${tipoOrdem}`,
      });
      throw error;
    }
  };

  const calcularOrdensNecessarias = (produtos: Produto[], tipoOrdem: string) => {
    if (!produtos || produtos.length === 0) return 0;
    
    let totalOrdens = 0;
    produtos.forEach(produto => {
      const quantidade = produto?.quantidade || 1;
      const tipoProduto = produto?.tipo_produto || '';
      
      // Calcular baseado no tipo específico de produto para cada ordem
      if (tipoOrdem === 'pintura') {
        // Para pintura, contar produtos do tipo pintura_epoxi
        if (tipoProduto.includes('pintura_epoxi')) {
          totalOrdens += quantidade;
        }
      } else if (['soldagem', 'separacao', 'perfiladeira', 'instalacao'].includes(tipoOrdem)) {
        // Para soldagem, separação, perfiladeira e instalação - contar produtos porta_enrolar
        if (tipoProduto.includes('porta_enrolar')) {
          totalOrdens += quantidade;
        }
      }
    });
    
    return totalOrdens;
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  return {
    pedidos,
    loading,
    fetchPedidos,
    criarPedidoDeOrcamento,
    criarOrdemProducao,
    calcularOrdensNecessarias,
    criarOrdensAutomaticamente
  };
}