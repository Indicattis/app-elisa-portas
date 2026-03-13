import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type TipoOrdem = 'embalagem';

export function useOrdemEmbalagem(onOrdemConcluida?: (pedidoId: string, tipoOrdem: TipoOrdem) => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens-embalagem"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: ordensData, error: ordensError } = await supabase
        .from("ordens_embalagem")
        .select('*, capturada_em, tempo_conclusao_segundos, em_backlog, prioridade')
        .eq('historico', false)
        .or(`responsavel_id.is.null,responsavel_id.eq.${user?.id || ''}`)
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (ordensError) throw ordensError;
      if (!ordensData) return [];

      const ordensComDados = await Promise.all(
        ordensData.map(async (ordem) => {
          const { data: pedido } = await supabase
            .from('pedidos_producao')
            .select(`
              id, numero_pedido, cliente_nome, venda_id, prioridade_etapa, em_backlog, observacoes, updated_at,
              vendas(id, observacoes_venda, produtos:produtos_vendas(id, tipo_produto, cor_id, largura, altura, catalogo_cores(nome, codigo_hex)))
            `)
            .eq('id', ordem.pedido_id)
            .maybeSingle();

          let responsavel = null;
          if (ordem.responsavel_id) {
            const { data } = await supabase
              .from('admin_users')
              .select('id, nome')
              .eq('user_id', ordem.responsavel_id)
              .maybeSingle();
            responsavel = data;
          }

          const { data: linhasRaw } = await supabase
            .from('linhas_ordens')
            .select('id, item, quantidade, tamanho, concluida, largura, altura, estoque_id, produto_venda_id, estoque:estoque_id (nome_produto)')
            .eq('ordem_id', ordem.id)
            .eq('tipo_ordem', 'embalagem');

          const linhas = linhasRaw?.map((linha: any) => ({
            ...linha,
            item: linha.estoque?.nome_produto || linha.item,
          })) || [];

          // Buscar observações da visita técnica
          const { data: observacoesVisita } = await supabase
            .from('pedido_porta_observacoes')
            .select('*')
            .eq('pedido_id', ordem.pedido_id);

          const vendasArray = Array.isArray(pedido?.vendas) ? pedido.vendas : [pedido?.vendas];
          const primeiraVenda = vendasArray.length > 0 ? vendasArray[0] : null;
          const produtos = primeiraVenda?.produtos || [];

          return {
            ...ordem,
            pedido: pedido ? {
              ...pedido,
              vendas: primeiraVenda ? { observacoes_venda: primeiraVenda.observacoes_venda } : undefined,
              produtos,
            } : { id: '', numero_pedido: '', cliente_nome: 'Cliente não encontrado', venda_id: undefined, produtos: [], vendas: undefined },
            admin_users: responsavel,
            linhas,
            observacoesVisita: observacoesVisita || [],
          };
        })
      );

      return ordensComDados;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('linhas-ordens-embalagem-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'linhas_ordens',
        filter: 'tipo_ordem=eq.embalagem'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['ordens-embalagem'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const ordensPendentes = ordens
    .filter((o: any) => o.status === 'pendente')
    .sort((a: any, b: any) => {
      const aPrio = a.pedido?.prioridade_etapa || 0;
      const bPrio = b.pedido?.prioridade_etapa || 0;
      if (bPrio !== aPrio) return bPrio - aPrio;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const ordensConcluidas = ordens.filter((o: any) => o.status === 'concluido');

  const capturarOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { count, error: countError } = await supabase
        .from('ordens_embalagem')
        .select('*', { count: 'exact', head: true })
        .eq('responsavel_id', user.id)
        .eq('historico', false);

      if (countError) throw countError;
      if (count !== null && count >= 3) {
        throw new Error('Você já possui 3 ordens capturadas. Finalize uma antes de capturar outra.');
      }

      const { data: ordemAtual } = await supabase
        .from("ordens_embalagem")
        .select('em_backlog, capturada_em')
        .eq('id', ordemId)
        .maybeSingle() as { data: { em_backlog?: boolean; capturada_em?: string } | null };

      const updateData: any = { responsavel_id: user.id };
      if (!ordemAtual?.em_backlog || !ordemAtual?.capturada_em) {
        updateData.capturada_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from("ordens_embalagem")
        .update(updateData)
        .eq("id", ordemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-embalagem"] });
      toast({ title: "Ordem capturada", description: "Você agora é responsável por esta ordem" });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível capturar a ordem", variant: "destructive" });
    },
  });

  const finalizarEmbalagem = useMutation({
    mutationFn: async (ordemId: string) => {
      const { data: linhas } = await supabase
        .from("linhas_ordens")
        .select("concluida")
        .eq("ordem_id", ordemId)
        .eq("tipo_ordem", "embalagem");

      if (linhas && linhas.length > 0 && linhas.some((l: any) => !l.concluida)) {
        throw new Error("Todas as linhas devem estar marcadas como concluídas");
      }

      const { data: ordem, error: ordemError } = await supabase
        .from("ordens_embalagem")
        .select("capturada_em, pedido_id")
        .eq("id", ordemId)
        .single();

      if (ordemError) throw ordemError;
      if (!ordem?.pedido_id) throw new Error("Pedido não encontrado para esta ordem");

      let tempo_conclusao_segundos = null;
      if (ordem?.capturada_em) {
        const captura = new Date(ordem.capturada_em);
        tempo_conclusao_segundos = Math.floor((new Date().getTime() - captura.getTime()) / 1000);
      }

      const { error } = await supabase
        .from("ordens_embalagem")
        .update({
          status: 'concluido',
          data_conclusao: new Date().toISOString(),
          tempo_conclusao_segundos,
          historico: true,
        })
        .eq("id", ordemId);

      if (error) throw error;
      return ordem.pedido_id;
    },
    onSuccess: (pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-embalagem"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-count"] });
      toast({ title: "Embalagem finalizada", description: "A ordem foi concluída com sucesso" });

      if (pedidoId && onOrdemConcluida) {
        onOrdemConcluida(pedidoId, 'embalagem');
      }
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível finalizar a embalagem", variant: "destructive" });
    },
  });

  const marcarLinhaConcluida = useMutation({
    mutationFn: async ({ linhaId, concluida }: { linhaId: string; concluida: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from("linhas_ordens")
        .update({
          concluida,
          concluida_em: concluida ? new Date().toISOString() : null,
          concluida_por: concluida ? user.id : null,
        })
        .eq("id", linhaId)
        .select();

      if (error) throw error;
      return { linhaId, concluida };
    },
    onMutate: async ({ linhaId, concluida }) => {
      await queryClient.cancelQueries({ queryKey: ["ordens-embalagem"] });
      const previousOrdens = queryClient.getQueryData(["ordens-embalagem"]);

      queryClient.setQueryData(["ordens-embalagem"], (old: any[] = []) => {
        return old.map(ordem => ({
          ...ordem,
          linhas: ordem.linhas?.map((linha: any) =>
            linha.id === linhaId ? { ...linha, concluida } : linha
          ) || []
        }));
      });

      return { previousOrdens };
    },
    onError: (error, variables, context) => {
      if (context?.previousOrdens) {
        queryClient.setQueryData(["ordens-embalagem"], context.previousOrdens);
      }
      toast({ title: "Erro", description: "Não foi possível atualizar a linha", variant: "destructive" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-embalagem"] });
    },
  });

  return {
    ordens,
    ordensPendentes,
    ordensConcluidas,
    isLoading,
    capturarOrdem,
    finalizarEmbalagem,
    marcarLinhaConcluida,
  };
}
