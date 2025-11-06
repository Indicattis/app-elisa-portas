import { useState, useEffect } from "react";
import { format, getDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InstalacaoCadastrada } from "./useInstalacoesCadastradas";

export interface InstalacaoCronograma extends InstalacaoCadastrada {
  dia_semana: number;
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
      
      // Buscar instalações da semana que têm data_instalacao definida e são do tipo 'elisa'
      const { data, error } = await supabase
        .from('instalacoes_cadastradas')
        .select('*')
        .not('data_instalacao', 'is', null)
        .eq('tipo_instalacao', 'elisa')
        .gte('data_instalacao', inicioFormatado)
        .lte('data_instalacao', fimFormatado)
        .order('data_instalacao');

      if (error) throw error;

      // Adicionar dia_semana para cada instalação
      const instalacoesComDia: InstalacaoCronograma[] = (data || [])
        .map(instalacao => {
          // Criar data no timezone local para evitar problemas de conversão
          const [ano, mes, dia] = instalacao.data_instalacao!.split('-').map(Number);
          const dataInstalacao = new Date(ano, mes - 1, dia);
          const diaSemana = getDay(dataInstalacao); // 0 = Domingo, 1 = Segunda, etc.
          
          console.log('Instalação carregada:', {
            id: instalacao.id,
            data_instalacao: instalacao.data_instalacao,
            dataCalculada: dataInstalacao,
            diaSemana
          });
          
          return {
            ...instalacao,
            status: instalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
            tipo_instalacao: instalacao.tipo_instalacao as 'elisa' | 'autorizados',
            dia_semana: diaSemana
          };
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
      
      console.log('Atualizando instalação:', {
        id,
        dataOriginal: novaData,
        dataFormatada,
        diaSemana: getDay(novaData)
      });

      // Buscar a instalação para pegar o pedido_id
      const { data: instalacaoData, error: instalacaoError } = await supabase
        .from('instalacoes_cadastradas')
        .select('pedido_id')
        .eq('id', id)
        .single();

      if (instalacaoError) throw instalacaoError;

      // Buscar o nome da equipe
      const { data: equipeData } = await supabase
        .from('equipes_instalacao')
        .select('nome')
        .eq('id', novaEquipeId)
        .single();

      // Atualizar a instalação
      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .update({
          data_instalacao: dataFormatada,
          responsavel_instalacao_id: novaEquipeId,
          responsavel_instalacao_nome: equipeData?.nome || null,
          tipo_instalacao: 'elisa'
        })
        .eq('id', id);

      if (error) throw error;

      // Se houver pedido associado, verificar se já tem data_entrega definida
      if (instalacaoData?.pedido_id) {
        const { data: pedidoData, error: pedidoCheckError } = await supabase
          .from('pedidos_producao')
          .select('data_entrega')
          .eq('id', instalacaoData.pedido_id)
          .single();

        if (pedidoCheckError) {
          console.error('Erro ao verificar data_entrega do pedido:', pedidoCheckError);
        } else if (!pedidoData?.data_entrega) {
          // Se não tiver data_entrega, definir automaticamente
          const { error: pedidoUpdateError } = await supabase
            .from('pedidos_producao')
            .update({ data_entrega: dataFormatada })
            .eq('id', instalacaoData.pedido_id);

          if (pedidoUpdateError) {
            console.error('Erro ao atualizar data_entrega do pedido:', pedidoUpdateError);
          }
        }
      }

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
          table: 'instalacoes_cadastradas'
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
