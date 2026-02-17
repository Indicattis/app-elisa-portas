import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePedidosEtapas } from "./usePedidosEtapas";

export interface ProdutoResumo {
  tipo: string;
  nome: string;
  quantidade: number;
  tamanho?: string;
  corNome?: string;
  corHex?: string;
}

export interface PedidoAprovacao {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  valor_venda: number | null;
  data_entrega: string | null;
  created_at: string;
  produtos_resumo: string;
  pedidoCompleto: any;
  tipo_entrega: 'instalacao' | 'entrega' | 'manutencao' | null;
  data_entrada_etapa: string | null;
  portasInfo: Array<{ tamanho: 'P' | 'G'; largura: number; altura: number }>;
  cores: Array<{ nome: string; codigo_hex: string }>;
  produtosResumo: ProdutoResumo[];
}

export function usePedidosAprovacaoCEO() {
  const queryClient = useQueryClient();
  const { moverParaProximaEtapa } = usePedidosEtapas('aprovacao_ceo');

  // Buscar pedidos na etapa aprovacao_ceo
  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ['pedidos-aprovacao-ceo'],
    queryFn: async () => {
      // Buscar pedidos em aprovação CEO com dados completos para o sheet
      const { data: pedidosData, error } = await supabase
        .from('pedidos_producao')
        .select(`
          *,
          vendas:venda_id (
            *,
            produtos_vendas (
              *,
              catalogo_cores:cor_id (nome, codigo_hex)
            )
          ),
          pedidos_etapas (
            data_entrada,
            etapa,
            data_saida
          )
        `)
        .eq('etapa_atual', 'aprovacao_ceo')
        .eq('arquivado', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!pedidosData) return [];

      // Funções auxiliares
      const calcularPortasInfo = (produtos: any[]) => {
        const portasEnrolar = produtos.filter(p => p.tipo_produto === 'porta_enrolar');
        const lista: Array<{ tamanho: 'P' | 'G'; largura: number; altura: number }> = [];
        
        portasEnrolar.forEach(p => {
          let largura = p.largura || 0;
          let altura = p.altura || 0;
          
          if (largura === 0 && altura === 0 && p.tamanho) {
            const match = p.tamanho.match(/(\d+[.,]?\d*)\s*[xX]\s*(\d+[.,]?\d*)/);
            if (match) {
              largura = parseFloat(match[1].replace(',', '.'));
              altura = parseFloat(match[2].replace(',', '.'));
            }
          }
          
          const area = largura * altura;
          const quantidade = p.quantidade || 1;
          const tamanhoCategoria = area > 25 ? 'G' : 'P';
          
          for (let i = 0; i < quantidade; i++) {
            lista.push({ tamanho: tamanhoCategoria, largura, altura });
          }
        });
        
        return lista;
      };

      const extrairCores = (produtos: any[]) => {
        const coresMap = new Map<string, { nome: string; codigo_hex: string }>();
        
        produtos.forEach(p => {
          if (p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'pintura_epoxi') {
            const cor = p.catalogo_cores || p.cor;
            if (cor?.nome && cor?.codigo_hex) {
              coresMap.set(cor.nome, { nome: cor.nome, codigo_hex: cor.codigo_hex });
            }
          }
        });
        
        return Array.from(coresMap.values());
      };

      const construirProdutosResumo = (produtos: any[]): ProdutoResumo[] => {
        const lista: ProdutoResumo[] = [];

        produtos.forEach((p: any) => {
          const qtd = p.quantidade || 1;

          if (p.tipo_produto === 'porta_enrolar') {
            let largura = p.largura || 0;
            let altura = p.altura || 0;
            if (largura === 0 && altura === 0 && p.tamanho) {
              const match = p.tamanho.match(/(\d+[.,]?\d*)\s*[xX]\s*(\d+[.,]?\d*)/);
              if (match) {
                largura = parseFloat(match[1].replace(',', '.'));
                altura = parseFloat(match[2].replace(',', '.'));
              }
            }
            const area = largura * altura;
            const cat = area > 25 ? 'G' : 'P';
            const tam = largura && altura ? `${largura.toFixed(2)} x ${altura.toFixed(2)}m (${cat})` : p.tamanho || '';
            lista.push({ tipo: 'porta_enrolar', nome: 'Porta de Enrolar', quantidade: qtd, tamanho: tam });
          } else if (p.tipo_produto === 'pintura_epoxi') {
            const cor = p.catalogo_cores || p.cor;
            lista.push({
              tipo: 'pintura_epoxi',
              nome: 'Pintura Epóxi',
              quantidade: qtd,
              corNome: cor?.nome || p.descricao || '',
              corHex: cor?.codigo_hex || undefined,
            });
          } else if (p.tipo_produto === 'acessorio' || p.tipo_produto === 'adicional') {
            lista.push({
              tipo: p.tipo_produto,
              nome: p.descricao || p.nome || (p.tipo_produto === 'acessorio' ? 'Acessório' : 'Adicional'),
              quantidade: qtd,
            });
          } else if (p.tipo_produto === 'motor') {
            lista.push({ tipo: 'motor', nome: p.descricao || 'Motor', quantidade: qtd });
          }
        });

        return lista;
      };

      return pedidosData.map((pedido: any) => {
        const venda = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
        const produtos = venda?.produtos_vendas || [];
        
        // Construir resumo de produtos
        const contagem: Record<string, number> = {};
        produtos.forEach((p: any) => {
          const tipo = p.tipo_produto === 'porta_enrolar' ? 'Porta de Enrolar' : 
                       p.tipo_produto === 'motor' ? 'Motor' :
                       p.tipo_produto === 'acessorio' ? 'Acessório' : p.tipo_produto;
          contagem[tipo] = (contagem[tipo] || 0) + (p.quantidade || 1);
        });
        
        const resumo = Object.entries(contagem)
          .map(([tipo, qtd]) => `${qtd} ${tipo}${qtd > 1 ? 's' : ''}`)
          .join(', ') || 'Sem produtos';

        // Buscar data_entrada da etapa atual
        const etapaAtual = pedido.pedidos_etapas?.find(
          (e: any) => e.etapa === 'aprovacao_ceo' && !e.data_saida
        );

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          cliente_nome: venda?.cliente_nome || 'Cliente não informado',
          valor_venda: venda?.valor_venda || null,
          data_entrega: pedido.data_entrega,
          created_at: pedido.created_at,
          produtos_resumo: resumo,
          pedidoCompleto: pedido,
          tipo_entrega: venda?.tipo_entrega || null,
          data_entrada_etapa: etapaAtual?.data_entrada || null,
          portasInfo: calcularPortasInfo(produtos),
          cores: extrairCores(produtos),
          produtosResumo: construirProdutosResumo(produtos),
        } as PedidoAprovacao;
      });
    },
    refetchInterval: 10000,
  });

  // Aprovar pedido e avançar para produção
  const aprovarPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      await moverParaProximaEtapa.mutateAsync({ pedidoId, skipCheckboxValidation: true });
    },
    onSuccess: () => {
      toast.success('Pedido aprovado e enviado para produção!');
      queryClient.invalidateQueries({ queryKey: ['pedidos-aprovacao-ceo'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    },
    onError: (error) => {
      toast.error('Erro ao aprovar: ' + error.message);
    }
  });

  // Reprovar pedido - volta para "aberto" com flag vermelha
  const reprovarPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Fechar etapa atual (aprovacao_ceo)
      const { error: fecharError } = await supabase
        .from('pedidos_etapas')
        .update({ data_saida: new Date().toISOString() } as any)
        .eq('pedido_id', pedidoId)
        .eq('etapa', 'aprovacao_ceo')
        .is('data_saida', null);

      if (fecharError) throw fecharError;

      // 2. Criar/reabrir etapa "aberto" via upsert
      const { error: etapaError } = await supabase
        .from('pedidos_etapas')
        .upsert({
          pedido_id: pedidoId,
          etapa: 'aberto',
          data_entrada: new Date().toISOString(),
          data_saida: null,
          checkboxes: [] as any
        }, { onConflict: 'pedido_id,etapa' });

      if (etapaError) throw etapaError;

      // 3. Atualizar pedido: voltar para aberto + flag reprovado
      const { error: updateError } = await supabase
        .from('pedidos_producao')
        .update({ 
          etapa_atual: 'aberto',
          reprovado_ceo: true,
          prioridade_etapa: 0
        } as any)
        .eq('id', pedidoId);

      if (updateError) throw updateError;

      // 4. Registrar movimentação
      await supabase.from('pedidos_movimentacoes').insert({
        pedido_id: pedidoId,
        user_id: user.id,
        etapa_origem: 'aprovacao_ceo',
        etapa_destino: 'aberto',
        teor: 'reprovacao',
        descricao: 'Pedido reprovado pela direção e devolvido para revisão'
      });
    },
    onSuccess: () => {
      toast.success('Pedido reprovado e devolvido para revisão');
      queryClient.invalidateQueries({ queryKey: ['pedidos-aprovacao-ceo'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
    },
    onError: (error) => {
      toast.error('Erro ao reprovar: ' + error.message);
    }
  });

  return {
    pedidos,
    isLoading,
    refetch,
    aprovarPedido,
    reprovarPedido
  };
}
