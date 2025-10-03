import { useState, useEffect } from "react";
import { format, getDay, startOfWeek, endOfWeek } from "date-fns";
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
      
      // Calcular início e fim da semana
      const inicioSemana = startOfWeek(semanaInicio, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(semanaInicio, { weekStartsOn: 1 });
      
      const inicioFormatado = format(inicioSemana, 'yyyy-MM-dd');
      const fimFormatado = format(fimSemana, 'yyyy-MM-dd');
      
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
          const dataInstalacao = new Date(instalacao.data_instalacao!);
          const diaSemana = getDay(dataInstalacao); // 0 = Domingo, 1 = Segunda, etc.
          
          return {
            ...instalacao,
            categoria: instalacao.categoria as 'instalacao' | 'entrega' | 'correcao' | 'carregamento_agendado',
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
      const dataFormatada = format(novaData, 'yyyy-MM-dd');

      // Buscar o nome da equipe
      const { data: equipeData } = await supabase
        .from('equipes_instalacao')
        .select('nome')
        .eq('id', novaEquipeId)
        .single();

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
