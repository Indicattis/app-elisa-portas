import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface OrdemInstalacao {
  id: string;
  pedido_id: string | null;
  venda_id: string | null;
  nome_cliente: string;
  data_instalacao: string | null;
  hora: string;
  tipo_instalacao: 'elisa' | 'autorizados' | null;
  responsavel_instalacao_id: string | null;
  responsavel_instalacao_nome: string | null;
  status: string | null;
  instalacao_concluida: boolean;
  instalacao_concluida_em: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  created_at: string;

  // Tipo de ordem derivado da etapa do pedido
  tipo_ordem?: 'instalacao' | 'correcao';
  
  // Campos de carregamento
  carregamento_concluido: boolean;
  carregamento_concluido_por: string | null;
  data_carregamento: string | null;
  
  // Dados do usuário que carregou
  carregador?: {
    user_id: string;
    nome: string;
    foto_perfil_url: string | null;
  } | null;
  
  // Dados relacionados
  pedido?: {
    id: string;
    numero_pedido: string;
    etapa_atual: string;
  } | null;
  venda?: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string | null;
    cliente_email: string | null;
    cidade: string | null;
    estado: string | null;
    bairro: string | null;
    valor_venda: number | null;
    metodo_pagamento: string | null;
    produtos?: Array<{
      tipo_produto: string;
      largura: number | null;
      altura: number | null;
      tamanho: string | null;
      quantidade: number;
    }>;
  } | null;
  equipe?: {
    id: string;
    nome: string;
    cor: string | null;
  } | null;
}

export const useOrdensInstalacao = () => {
  const queryClient = useQueryClient();

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens_instalacao"],
    queryFn: async () => {
      // Buscar instalações de pedidos na etapa 'instalacoes' que não foram concluídas
      const { data, error } = await supabase
        .from("instalacoes")
        .select(`
          *,
          pedido:pedidos_producao!instalacoes_pedido_id_fkey(
            id,
            numero_pedido,
            etapa_atual
          ),
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            cidade,
            estado,
            bairro,
            valor_venda,
            metodo_pagamento,
            produtos:produtos_vendas(
              tipo_produto,
              largura,
              altura,
              tamanho,
              quantidade
            )
          )
        `)
        .eq('instalacao_concluida', false)
        .order('data_instalacao', { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Erro ao buscar ordens de instalação:", error);
        throw error;
      }

      // Filtrar pedidos nas etapas 'instalacoes' ou 'correcoes'
      const ordensFiltered = (data || []).filter((ordem: any) =>
        ordem.pedido?.etapa_atual === 'instalacoes' ||
        ordem.pedido?.etapa_atual === 'correcoes'
      );

      // Buscar equipes para mapear cores
      const { data: equipes } = await supabase
        .from("equipes_instalacao")
        .select("id, nome, cor")
        .eq("ativa", true);

      const equipesMap = new Map(equipes?.map(e => [e.id, e]) || []);

      // Buscar fotos dos usuários que carregaram
      const carregadoPorIds = [...new Set(
        ordensFiltered
          .filter((o: any) => o.carregamento_concluido_por)
          .map((o: any) => o.carregamento_concluido_por)
      )] as string[];

      let usuariosMap = new Map<string, { user_id: string; nome: string; foto_perfil_url: string | null }>();
      
      if (carregadoPorIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('admin_users')
          .select('user_id, nome, foto_perfil_url')
          .in('user_id', carregadoPorIds);
        
        usuariosMap = new Map(usuarios?.map(u => [u.user_id, u]) || []);
      }

      return ordensFiltered.map((ordem: any) => ({
        ...ordem,
        tipo_ordem: ordem.pedido?.etapa_atual === 'correcoes' ? 'correcao' : 'instalacao',
        equipe: ordem.responsavel_instalacao_id 
          ? equipesMap.get(ordem.responsavel_instalacao_id) || null 
          : null,
        carregador: ordem.carregamento_concluido_por 
          ? usuariosMap.get(ordem.carregamento_concluido_por) || null 
          : null,
      })) as OrdemInstalacao[];
    },
  });

  const concluirOrdemMutation = useMutation({
    mutationFn: async (instalacaoId: string) => {
      const { data: user } = await supabase.auth.getUser();

      // 1. Buscar dados da instalação
      const { data: instalacao, error: fetchError } = await supabase
        .from("instalacoes")
        .select("id, pedido_id")
        .eq("id", instalacaoId)
        .single();

      if (fetchError || !instalacao) {
        throw new Error("Instalação não encontrada");
      }

      // 2. Marcar instalação como concluída
      const { error: updateError } = await supabase
        .from("instalacoes")
        .update({
          instalacao_concluida: true,
          instalacao_concluida_em: new Date().toISOString(),
          instalacao_concluida_por: user.user?.id,
          status: 'finalizada',
          updated_at: new Date().toISOString(),
        })
        .eq("id", instalacaoId);

      if (updateError) throw updateError;

      // 3. Avançar pedido para 'finalizado'
      if (instalacao.pedido_id) {
        // Registrar saída da etapa atual
        const { data: etapaAtual } = await supabase
          .from("pedidos_etapas")
          .select("id")
          .eq("pedido_id", instalacao.pedido_id)
          .is("data_saida", null)
          .maybeSingle();

        if (etapaAtual) {
          await supabase
            .from("pedidos_etapas")
            .update({ data_saida: new Date().toISOString() })
            .eq("id", etapaAtual.id);
        }

        // Criar registro da nova etapa
        await supabase
          .from("pedidos_etapas")
          .insert({
            pedido_id: instalacao.pedido_id,
            etapa: 'finalizado',
            checkboxes: [],
            data_entrada: new Date().toISOString(),
          });

        // Atualizar etapa atual do pedido
        const { error: pedidoError } = await supabase
          .from("pedidos_producao")
          .update({ 
            etapa_atual: 'finalizado',
            updated_at: new Date().toISOString()
          })
          .eq("id", instalacao.pedido_id);

        if (pedidoError) throw pedidoError;
      }

      return instalacaoId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_instalacao"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos-etapas"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos-contadores"] });
      toast.success("Instalação concluída! Pedido finalizado.");
    },
    onError: (error) => {
      console.error("Erro ao concluir instalação:", error);
      toast.error("Erro ao concluir instalação");
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("ordens_instalacao_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instalacoes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_instalacao"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos_producao",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ordens_instalacao"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    ordens,
    isLoading,
    concluirOrdem: concluirOrdemMutation.mutateAsync,
    isConcluindo: concluirOrdemMutation.isPending,
  };
};
