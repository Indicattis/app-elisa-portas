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
      
      // Buscar instalações com joins para equipes e autorizados
      const { data, error } = await supabase
        .from('instalacoes')
        .select(`
          *,
          pedido:pedidos_producao(id, numero_pedido, etapa_atual),
          venda:vendas(id, cliente_nome, cliente_telefone, cliente_email),
          equipe:equipes_instalacao(id, nome, cor),
          autorizado:autorizados(id, nome, cidade, estado)
        `)
        .not('data_instalacao', 'is', null)
        .gte('data_instalacao', inicioFormatado)
        .lte('data_instalacao', fimFormatado)
        .order('data_instalacao');

      if (error) throw error;

      // Adicionar dia_semana e responsável unificado para cada instalação
      const instalacoesComDia: InstalacaoCronograma[] = (data || [])
        .map((instalacao: any) => {
          // Criar data no timezone local para evitar problemas de conversão
          const [ano, mes, dia] = instalacao.data_instalacao!.split('-').map(Number);
          const dataInstalacao = new Date(ano, mes - 1, dia);
          const diaSemana = getDay(dataInstalacao); // 0 = Domingo, 1 = Segunda, etc.
          
          return {
            ...instalacao,
            status: instalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
            tipo_instalacao: instalacao.tipo_instalacao as 'elisa' | 'autorizados' | null,
            dia_semana: diaSemana,
            equipe: Array.isArray(instalacao.equipe) ? instalacao.equipe[0] : instalacao.equipe,
            autorizado: Array.isArray(instalacao.autorizado) ? instalacao.autorizado[0] : instalacao.autorizado,
            pedido: Array.isArray(instalacao.pedido) ? instalacao.pedido[0] : instalacao.pedido,
            venda: Array.isArray(instalacao.venda) ? instalacao.venda[0] : instalacao.venda
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

      // Atualizar a instalação
      const { error } = await supabase
        .from('instalacoes')
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
          table: 'instalacoes'
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
