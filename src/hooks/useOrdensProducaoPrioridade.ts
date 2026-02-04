import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrdemProducaoSimples {
  id: string;
  numero_ordem: string;
  pedido_id: string;
  status: string;
  prioridade: number;
  cliente_nome: string;
  numero_pedido: string;
  responsavel_nome?: string;
  responsavel_id?: string;
  pausada?: boolean;
  metragem_linear?: number;
  metragem_quadrada?: number;
  justificativa_pausa?: string;
  cores?: { nome: string; codigo_hex: string }[];
}

export type TipoOrdemProducao = 'perfiladeira' | 'soldagem' | 'separacao' | 'qualidade' | 'pintura';

type TabelaOrdem = 'ordens_perfiladeira' | 'ordens_soldagem' | 'ordens_separacao' | 'ordens_qualidade' | 'ordens_pintura';

const TABELA_MAP: Record<TipoOrdemProducao, TabelaOrdem> = {
  perfiladeira: 'ordens_perfiladeira',
  soldagem: 'ordens_soldagem',
  separacao: 'ordens_separacao',
  qualidade: 'ordens_qualidade',
  pintura: 'ordens_pintura',
};

export function useOrdensProducaoPrioridade(tipo: TipoOrdemProducao) {
  const queryClient = useQueryClient();
  const tabela = TABELA_MAP[tipo];

  const { data: ordens = [], isLoading, refetch } = useQuery({
    queryKey: ['ordens-prioridade', tipo],
    queryFn: async () => {
      // Query specific to each table type
      let data: any[] | null = null;
      let error: any = null;

      if (tabela === 'ordens_perfiladeira') {
        const result = await supabase
          .from('ordens_perfiladeira')
          .select('id, numero_ordem, pedido_id, status, prioridade, responsavel_id, pausada, metragem_linear, justificativa_pausa, pedido:pedidos_producao(numero_pedido, cliente_nome, venda_id)')
          .eq('historico', false)
          .order('prioridade', { ascending: false })
          .order('created_at', { ascending: true });
        data = result.data;
        error = result.error;
      } else if (tabela === 'ordens_soldagem') {
        const result = await supabase
          .from('ordens_soldagem')
          .select('id, numero_ordem, pedido_id, status, prioridade, responsavel_id, pausada, metragem_quadrada, justificativa_pausa, pedido:pedidos_producao(numero_pedido, cliente_nome, venda_id)')
          .eq('historico', false)
          .order('prioridade', { ascending: false })
          .order('created_at', { ascending: true });
        data = result.data;
        error = result.error;
      } else if (tabela === 'ordens_separacao') {
        const result = await supabase
          .from('ordens_separacao')
          .select('id, numero_ordem, pedido_id, status, prioridade, responsavel_id, pausada, justificativa_pausa, pedido:pedidos_producao(numero_pedido, cliente_nome, venda_id)')
          .eq('historico', false)
          .order('prioridade', { ascending: false })
          .order('created_at', { ascending: true });
        data = result.data;
        error = result.error;
      } else if (tabela === 'ordens_qualidade') {
        const result = await supabase
          .from('ordens_qualidade')
          .select('id, numero_ordem, pedido_id, status, prioridade, responsavel_id, pausada, justificativa_pausa, pedido:pedidos_producao(numero_pedido, cliente_nome, venda_id)')
          .eq('historico', false)
          .order('prioridade', { ascending: false })
          .order('created_at', { ascending: true });
        data = result.data;
        error = result.error;
      } else if (tabela === 'ordens_pintura') {
        const result = await supabase
          .from('ordens_pintura')
          .select('id, numero_ordem, pedido_id, status, prioridade, responsavel_id, metragem_quadrada, pedido:pedidos_producao(numero_pedido, cliente_nome, venda_id)')
          .eq('historico', false)
          .order('prioridade', { ascending: false })
          .order('created_at', { ascending: true });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Buscar nomes dos responsáveis
      const responsavelIds = data
        ?.filter((o: any) => o.responsavel_id)
        .map((o: any) => o.responsavel_id) || [];

      let usuariosMap = new Map<string, string>();
      if (responsavelIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('admin_users')
          .select('user_id, nome')
          .in('user_id', responsavelIds);
        
        usuariosMap = new Map(usuarios?.map(u => [u.user_id, u.nome]) || []);
      }

      // Buscar cores das portas via venda_produtos
      const vendaIds = data
        ?.map((o: any) => o.pedido?.venda_id)
        .filter(Boolean) || [];

      let coresPorVendaId = new Map<string, { nome: string; codigo_hex: string }[]>();
      if (vendaIds.length > 0) {
        const produtosResult = await (supabase as any)
          .from('venda_produtos')
          .select('venda_id, cor_id')
          .in('venda_id', vendaIds);
        const produtos = produtosResult.data as any[] | null;

        // Buscar as cores
        const corIds = produtos?.map((p: any) => p.cor_id).filter(Boolean) || [];
        let coresMap = new Map<string, { nome: string; codigo_hex: string }>();
        if (corIds.length > 0) {
          const coresResult = await (supabase as any)
            .from('catalogo_cores')
            .select('id, nome, codigo_hex')
            .in('id', corIds);
          const cores = coresResult.data as any[] | null;
          
          coresMap = new Map(cores?.map((c: any) => [c.id, { nome: c.nome, codigo_hex: c.codigo_hex }]) || []);
        }

        // Agrupar cores por venda_id (sem duplicatas)
        if (produtos) {
          for (const produto of produtos) {
            if (produto.cor_id && coresMap.has(produto.cor_id)) {
              const cor = coresMap.get(produto.cor_id)!;
              const existing = coresPorVendaId.get(produto.venda_id) || [];
              // Evitar duplicatas
              if (!existing.some(c => c.codigo_hex === cor.codigo_hex)) {
                existing.push(cor);
                coresPorVendaId.set(produto.venda_id, existing);
              }
            }
          }
        }
      }

      return (data || []).map((ordem: any) => ({
        id: ordem.id,
        numero_ordem: ordem.numero_ordem,
        pedido_id: ordem.pedido_id,
        status: ordem.status,
        prioridade: ordem.prioridade || 0,
        cliente_nome: ordem.pedido?.cliente_nome || 'N/A',
        numero_pedido: ordem.pedido?.numero_pedido || 'N/A',
        responsavel_id: ordem.responsavel_id,
        responsavel_nome: ordem.responsavel_id ? usuariosMap.get(ordem.responsavel_id) : undefined,
        pausada: ordem.pausada,
        metragem_linear: ordem.metragem_linear,
        metragem_quadrada: ordem.metragem_quadrada,
        justificativa_pausa: ordem.justificativa_pausa,
        cores: ordem.pedido?.venda_id ? coresPorVendaId.get(ordem.pedido.venda_id) : undefined,
      })) as OrdemProducaoSimples[];
    },
  });

  const reorganizarMutation = useMutation({
    mutationFn: async (ordensReorganizadas: OrdemProducaoSimples[]) => {
      // Atualizar prioridades em batch
      const updates = ordensReorganizadas.map((ordem, index) => ({
        id: ordem.id,
        prioridade: ordensReorganizadas.length - index,
      }));

      for (const { id, prioridade } of updates) {
        let error: any = null;

        if (tabela === 'ordens_perfiladeira') {
          const result = await supabase.from('ordens_perfiladeira').update({ prioridade }).eq('id', id);
          error = result.error;
        } else if (tabela === 'ordens_soldagem') {
          const result = await supabase.from('ordens_soldagem').update({ prioridade }).eq('id', id);
          error = result.error;
        } else if (tabela === 'ordens_separacao') {
          const result = await supabase.from('ordens_separacao').update({ prioridade }).eq('id', id);
          error = result.error;
        } else if (tabela === 'ordens_qualidade') {
          const result = await supabase.from('ordens_qualidade').update({ prioridade }).eq('id', id);
          error = result.error;
        } else if (tabela === 'ordens_pintura') {
          const result = await supabase.from('ordens_pintura').update({ prioridade }).eq('id', id);
          error = result.error;
        }
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Prioridades atualizadas');
      queryClient.invalidateQueries({ queryKey: ['ordens-prioridade', tipo] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar prioridades');
      console.error(error);
    },
  });

  return {
    ordens,
    isLoading,
    refetch,
    reorganizarOrdens: reorganizarMutation.mutate,
    isReorganizing: reorganizarMutation.isPending,
  };
}
