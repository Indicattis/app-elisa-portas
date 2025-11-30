import { useState, useEffect } from "react";
import { format, getDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InstalacaoCadastrada } from "./useInstalacoesCadastradas";

export interface InstalacaoCronograma extends InstalacaoCadastrada {
  dia_semana: number;
  equipe?: { id: string; nome: string; cor: string | null } | null;
  autorizado?: { id: string; nome: string; cidade: string | null; estado: string | null } | null;
  pedido?: { id: string; numero_pedido: string; etapa_atual: string } | null;
}

export function useInstalacoesCronograma(semanaInicio: Date) {
  const [instalacoes, setInstalacoes] = useState<InstalacaoCronograma[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstalacoes = async () => {
    try {
      setLoading(true);
      
      // Sempre busca do início ao fim do range passado (pode ser semana ou mês)
      const inicioFormatado = format(semanaInicio, 'yyyy-MM-dd');
      
      // Calcular o fim baseado no início - se for dia 1, assume que é mês
      const dia = semanaInicio.getDate();
      const fimRange = dia === 1 ? endOfMonth(semanaInicio) : endOfWeek(semanaInicio, { weekStartsOn: 1 });
      const fimFormatado = format(fimRange, 'yyyy-MM-dd');
      
      // Buscar ordens de carregamento que são instalações
      const { data, error } = await supabase
        .from('ordens_carregamento')
        .select(`
          *,
          venda:vendas!inner(
            id, cliente_nome, cliente_telefone, cliente_email, tipo_entrega,
            estado, cidade, cep, endereco_completo, valor_a_receber,
            pagamento_na_entrega, forma_pagamento, observacoes
          ),
          pedido:pedidos_producao!ordens_carregamento_pedido_id_fkey(
            id, numero_pedido, etapa_atual,
            instalacao:instalacoes(id, status, tipo_instalacao, instalacao_concluida)
          ),
          equipe:equipes_instalacao(id, nome, cor),
          autorizado:autorizados(id, nome, cidade, estado)
        `)
        .eq('venda.tipo_entrega', 'instalacao')
        .not('data_carregamento', 'is', null)
        .gte('data_carregamento', inicioFormatado)
        .lte('data_carregamento', fimFormatado)
        .order('data_carregamento');

      if (error) throw error;

      // Adicionar dia_semana e mapear para estrutura compatível
      const instalacoesComDia: InstalacaoCronograma[] = (data || [])
        .map((ordem: any) => {
          // Criar data no timezone local para evitar problemas de conversão
          const [ano, mes, dia] = ordem.data_carregamento!.split('-').map(Number);
          const dataCarregamento = new Date(ano, mes - 1, dia);
          const diaSemana = getDay(dataCarregamento); // 0 = Domingo, 1 = Segunda, etc.
          
          const pedidoData = Array.isArray(ordem.pedido) ? ordem.pedido[0] : ordem.pedido;
          const instalacaoData = pedidoData?.instalacao ? (Array.isArray(pedidoData.instalacao) ? pedidoData.instalacao[0] : pedidoData.instalacao) : null;
          
          return {
            id: ordem.id,
            venda_id: ordem.venda_id,
            pedido_id: ordem.pedido_id,
            nome_cliente: ordem.venda?.cliente_nome || '',
            data_instalacao: ordem.data_carregamento,
            hora: '08:00',
            responsavel_instalacao_id: ordem.responsavel_carregamento_id,
            responsavel_instalacao_nome: ordem.responsavel_carregamento_nome,
            tipo_instalacao: ordem.tipo_carregamento as 'elisa' | 'autorizados' | null,
            status: instalacaoData?.status || 'pendente_producao',
            instalacao_concluida: instalacaoData?.instalacao_concluida || false,
            instalacao_concluida_em: null,
            instalacao_concluida_por: null,
            latitude: null,
            longitude: null,
            last_geocoded_at: null,
            geocode_precision: null,
            created_at: ordem.created_at,
            updated_at: ordem.updated_at,
            created_by: ordem.created_by,
            observacoes: ordem.observacoes,
            dia_semana: diaSemana,
            equipe: Array.isArray(ordem.equipe) ? ordem.equipe[0] : ordem.equipe,
            autorizado: Array.isArray(ordem.autorizado) ? ordem.autorizado[0] : ordem.autorizado,
            pedido: pedidoData ? {
              id: pedidoData.id,
              numero_pedido: pedidoData.numero_pedido,
              etapa_atual: pedidoData.etapa_atual
            } : null,
            venda: ordem.venda ? {
              id: ordem.venda.id,
              cliente_nome: ordem.venda.cliente_nome,
              cliente_telefone: ordem.venda.cliente_telefone,
              cliente_email: ordem.venda.cliente_email,
              estado: ordem.venda.estado || '',
              cidade: ordem.venda.cidade || '',
              cep: ordem.venda.cep || '',
              endereco_completo: ordem.venda.endereco_completo || '',
              valor_a_receber: ordem.venda.valor_a_receber || 0,
              pagamento_na_entrega: ordem.venda.pagamento_na_entrega || false,
              forma_pagamento: ordem.venda.forma_pagamento || '',
              observacoes_venda: ordem.venda.observacoes || ''
            } : null
          } as InstalacaoCronograma;
        });

      setInstalacoes(instalacoesComDia);
    } catch (error) {
      console.error('Erro ao buscar instalações do cronograma:', error);
      toast.error('Erro ao carregar instalações do cronograma');
    } finally {
      setLoading(false);
    }
  };

  const updateInstalacaoData = async (
    id: string,
    novaEquipeId: string,
    novaData: Date
  ) => {
    try {
      // Formatar a data no timezone local para evitar problemas de conversão
      const ano = novaData.getFullYear();
      const mes = String(novaData.getMonth() + 1).padStart(2, '0');
      const dia = String(novaData.getDate()).padStart(2, '0');
      const dataFormatada = `${ano}-${mes}-${dia}`;

      // Buscar o nome da equipe
      const { data: equipeData } = await supabase
        .from('equipes_instalacao')
        .select('nome')
        .eq('id', novaEquipeId)
        .single();

      // Atualizar a ordem de carregamento
      const { error } = await supabase
        .from('ordens_carregamento')
        .update({
          data_carregamento: dataFormatada,
          responsavel_carregamento_id: novaEquipeId,
          responsavel_carregamento_nome: equipeData?.nome || null,
          tipo_carregamento: 'elisa'
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Data da instalação atualizada');
      await fetchInstalacoes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar instalação:', error);
      toast.error('Erro ao mover instalação');
      return false;
    }
  };

  useEffect(() => {
    fetchInstalacoes();

    // Subscribe to changes
    const channel = supabase
      .channel('instalacoes_cronograma_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_carregamento'
        },
        () => {
          fetchInstalacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [semanaInicio]);

  return {
    instalacoes,
    loading,
    fetchInstalacoes,
    updateInstalacaoData
  };
}
