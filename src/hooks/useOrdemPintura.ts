import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type TipoOrdem = 'pintura';

export function useOrdemPintura(onOrdemConcluida?: (pedidoId: string, tipoOrdem: TipoOrdem) => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as ordens de pintura
  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens-pintura"],
    queryFn: async () => {
      // Obter usuário atual para filtrar visibilidade
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar as ordens, excluindo histórico
      // Filtrar: (sem responsável OU responsável é o usuário atual) E não está no histórico
      const { data: ordensData, error: ordensError } = await supabase
        .from("ordens_pintura")
        .select('*, capturada_em, tempo_conclusao_segundos, em_backlog, prioridade')
        .eq('historico', false)
        .or(`responsavel_id.is.null,responsavel_id.eq.${user?.id || ''}`)
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (ordensError) throw ordensError;
      if (!ordensData) return [];

      // Buscar dados relacionados para cada ordem
      const ordensComDados = await Promise.all(
        ordensData.map(async (ordem) => {
          // Buscar pedido com produtos
          const { data: pedido } = await supabase
            .from('pedidos_producao')
            .select(`
              id, 
              numero_pedido, 
              cliente_nome,
              venda_id,
              vendas(
                id,
                observacoes_venda,
                produtos:produtos_vendas(
                  id,
                  tipo_produto,
                  cor_id,
                  catalogo_cores(nome, codigo_hex)
                )
              )
            `)
            .eq('id', ordem.pedido_id)
            .maybeSingle();

          // Buscar responsável (apenas se houver responsavel_id)
          let responsavel = null;
          if (ordem.responsavel_id) {
            const { data } = await supabase
              .from('admin_users')
              .select('id, nome')
              .eq('user_id', ordem.responsavel_id)
              .maybeSingle();
            responsavel = data;
          }

          // Buscar linhas
          const { data: linhas } = await supabase
            .from('linhas_ordens')
            .select('id, item, quantidade, tamanho, concluida, largura, altura, estoque_id, produto_venda_id, cor_nome, tipo_pintura')
            .eq('ordem_id', ordem.id)
            .eq('tipo_ordem', 'pintura');

          // Processar produtos da venda
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
            linhas: linhas || [],
          };
        })
      );

      return ordensComDados;
    },
  });

  // Subscribe to realtime updates for linhas_ordens
  useEffect(() => {
    const channel = supabase
      .channel('linhas-ordens-pintura-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'linhas_ordens',
          filter: 'tipo_ordem=eq.pintura'
        },
        () => {
          // Invalidate queries on any update to refresh data
          queryClient.invalidateQueries({ queryKey: ['ordens-pintura'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtrar ordens por status e ordenar por backlog e prioridade
  const ordensParaPintar = ordens
    .filter((o: any) => o.status === 'pendente')
    .sort((a: any, b: any) => {
      // Ordens em backlog primeiro
      if (a.em_backlog && !b.em_backlog) return -1;
      if (!a.em_backlog && b.em_backlog) return 1;
      // Depois por prioridade (maior primeiro)
      const prioDiff = (b.prioridade || 0) - (a.prioridade || 0);
      if (prioDiff !== 0) return prioDiff;
      // Desempate por created_at (mais antiga primeiro) para manter ordem estática
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  
  const ordensProntas = ordens.filter((o: any) => o.status === 'pronta');

  // Capturar ordem (atribuir responsável)
  const capturarOrdem = useMutation({
    mutationFn: async (ordemId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se a ordem está em backlog
      const { data: ordemAtual } = await supabase
        .from("ordens_pintura")
        .select('em_backlog, capturada_em')
        .eq('id', ordemId)
        .maybeSingle() as { data: { em_backlog?: boolean; capturada_em?: string } | null };
      
      // Se está em backlog e já tem capturada_em, manter o tempo original
      const updateData: any = {
        responsavel_id: user.id,
      };
      
      // Só atualizar capturada_em se NÃO estiver em backlog ou se ainda não tiver sido capturada
      if (!ordemAtual?.em_backlog || !ordemAtual?.capturada_em) {
        updateData.capturada_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from("ordens_pintura")
        .update(updateData)
        .eq("id", ordemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-pintura"] });
      toast({
        title: "Ordem capturada",
        description: "Você agora é responsável por esta ordem",
      });
    },
    onError: (error) => {
      console.error("Erro ao capturar ordem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível capturar a ordem",
        variant: "destructive",
      });
    },
  });


  // Finalizar pintura (pintando -> pronta)
  const finalizarPintura = useMutation({
    mutationFn: async (ordemId: string) => {
      // Verificar se todas as linhas estão concluídas (se existirem)
      const { data: linhas } = await supabase
        .from("linhas_ordens")
        .select("concluida")
        .eq("ordem_id", ordemId)
        .eq("tipo_ordem", "pintura");

      // Só verificar linhas se existirem
      if (linhas && linhas.length > 0 && linhas.some((l: any) => !l.concluida)) {
        throw new Error("Todas as linhas devem estar marcadas como concluídas");
      }

      // Buscar ordem completa para pegar pedido_id e capturada_em
      const { data: ordem, error: ordemError } = await supabase
        .from("ordens_pintura")
        .select("capturada_em, pedido_id")
        .eq("id", ordemId)
        .single();

      if (ordemError) {
        console.error("[finalizarPintura] Erro ao buscar ordem:", ordemError);
        throw ordemError;
      }

      if (!ordem?.pedido_id) {
        console.error("[finalizarPintura] pedido_id não encontrado na ordem");
        throw new Error("Pedido não encontrado para esta ordem");
      }

      let tempo_conclusao_segundos = null;
      if (ordem?.capturada_em) {
        const captura = new Date(ordem.capturada_em);
        const agora = new Date();
        tempo_conclusao_segundos = Math.floor((agora.getTime() - captura.getTime()) / 1000);
      }

      const { error } = await supabase
        .from("ordens_pintura")
        .update({ 
          status: 'pronta',
          data_conclusao: new Date().toISOString(),
          tempo_conclusao_segundos,
          historico: true, // Enviar para histórico ao finalizar
        })
        .eq("id", ordemId);

      if (error) throw error;
      
      console.log("[finalizarPintura] Ordem finalizada, pedido_id:", ordem.pedido_id);
      return ordem.pedido_id;
    },
    onSuccess: (pedidoId) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-pintura"] });
      queryClient.invalidateQueries({ queryKey: ["ordens-count"] });
      toast({
        title: "Pintura finalizada",
        description: "A ordem foi concluída e está pronta",
      });

      // Tentar avanço automático do pedido
      console.log("[finalizarPintura] onSuccess - pedidoId:", pedidoId, "onOrdemConcluida:", !!onOrdemConcluida);
      if (pedidoId && onOrdemConcluida) {
        console.log("[finalizarPintura] Chamando onOrdemConcluida...");
        onOrdemConcluida(pedidoId, 'pintura');
      }
    },
    onError: (error: any) => {
      console.error("Erro ao finalizar pintura:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível finalizar a pintura",
        variant: "destructive",
      });
    },
  });

  // Marcar linha como concluída
  const marcarLinhaConcluida = useMutation({
    mutationFn: async ({ linhaId, concluida }: { linhaId: string; concluida: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
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
      // Cancelar queries pendentes
      await queryClient.cancelQueries({ queryKey: ["ordens-pintura"] });

      // Snapshot do valor anterior
      const previousOrdens = queryClient.getQueryData(["ordens-pintura"]);

      // Atualizar otimisticamente
      queryClient.setQueryData(["ordens-pintura"], (old: any[] = []) => {
        return old.map(ordem => ({
          ...ordem,
          linhas: ordem.linhas?.map((linha: any) =>
            linha.id === linhaId
              ? { ...linha, concluida }
              : linha
          ) || []
        }));
      });

      return { previousOrdens };
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousOrdens) {
        queryClient.setQueryData(["ordens-pintura"], context.previousOrdens);
      }
      console.error("Erro ao marcar linha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a linha",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidar queries para refetch
      queryClient.invalidateQueries({ queryKey: ["ordens-pintura"] });
    },
  });

  // Enviar ordem para histórico
  const enviarParaHistorico = useMutation({
    mutationFn: async (ordemId: string) => {
      const { error } = await supabase
        .from("ordens_pintura" as any)
        .update({ historico: true })
        .eq("id", ordemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens-pintura"] });
      queryClient.invalidateQueries({ queryKey: ["historico-ordens"] });
      toast({
        title: "Ordem enviada para histórico",
        description: "A ordem não aparecerá mais na lista de produção",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao enviar ordem para histórico:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a ordem para o histórico",
        variant: "destructive",
      });
    },
  });

  return {
    ordens,
    ordensParaPintar,
    ordensProntas,
    isLoading,
    capturarOrdem,
    finalizarPintura,
    marcarLinhaConcluida,
    enviarParaHistorico,
  };
}
