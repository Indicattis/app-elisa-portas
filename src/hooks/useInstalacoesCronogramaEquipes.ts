import { useState, useEffect } from "react";
import { format, getDay, endOfWeek, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InstalacaoCronogramaEquipe {
  id: string;
  venda_id: string | null;
  pedido_id: string | null;
  nome_cliente: string;
  data_instalacao: string | null;
  hora: string;
  responsavel_instalacao_id: string | null;
  responsavel_instalacao_nome: string | null;
  tipo_instalacao: 'elisa' | 'autorizados' | null;
  status: string;
  instalacao_concluida: boolean;
  instalacao_concluida_em: string | null;
  instalacao_concluida_por: string | null;
  latitude: number | null;
  longitude: number | null;
  cep: string | null;
  endereco: string | null;
  estado: string | null;
  cidade: string | null;
  telefone_cliente: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  dia_semana: number;
  equipe?: { id: string; nome: string; cor: string | null } | null;
  autorizado?: { id: string; nome: string; cidade: string | null; estado: string | null } | null;
  pedido?: { id: string; numero_pedido: string; etapa_atual: string } | null;
  venda?: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string | null;
    cliente_email: string | null;
    estado: string;
    cidade: string;
    cep: string;
    endereco_completo: string | null;
  } | null;
}

export function useInstalacoesCronogramaEquipes(semanaInicio: Date) {
  const [instalacoes, setInstalacoes] = useState<InstalacaoCronogramaEquipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstalacoes = async () => {
    try {
      setLoading(true);
      
      const inicioFormatado = format(semanaInicio, 'yyyy-MM-dd');
      
      // Calcular o fim baseado no início - se for dia 1, assume que é mês
      const dia = semanaInicio.getDate();
      const fimRange = dia === 1 ? endOfMonth(semanaInicio) : endOfWeek(semanaInicio, { weekStartsOn: 1 });
      const fimFormatado = format(fimRange, 'yyyy-MM-dd');
      
      // Buscar diretamente da tabela instalacoes
      const { data, error } = await supabase
        .from('instalacoes')
        .select(`
          *,
          venda:vendas(
            id, cliente_nome, cliente_telefone, cliente_email,
            estado, cidade, cep, endereco_completo
          ),
          pedido:pedidos_producao(
            id, numero_pedido, etapa_atual
          ),
          equipe:equipes_instalacao(
            id, nome, cor
          )
        `)
        .not('data_instalacao', 'is', null)
        .gte('data_instalacao', inicioFormatado)
        .lte('data_instalacao', fimFormatado)
        .eq('instalacao_concluida', false)
        .order('data_instalacao');

      if (error) throw error;

      // Mapear para estrutura com dia_semana
      const instalacoesComDia: InstalacaoCronogramaEquipe[] = (data || []).map((inst: any) => {
        const [ano, mes, diaData] = inst.data_instalacao!.split('-').map(Number);
        const dataInstalacao = new Date(ano, mes - 1, diaData);
        const diaSemana = getDay(dataInstalacao);
        
        return {
          id: inst.id,
          venda_id: inst.venda_id,
          pedido_id: inst.pedido_id,
          nome_cliente: inst.nome_cliente,
          data_instalacao: inst.data_instalacao,
          hora: inst.hora || '08:00',
          responsavel_instalacao_id: inst.responsavel_instalacao_id,
          responsavel_instalacao_nome: inst.responsavel_instalacao_nome,
          tipo_instalacao: inst.tipo_instalacao as 'elisa' | 'autorizados' | null,
          status: inst.status || 'pendente',
          instalacao_concluida: inst.instalacao_concluida || false,
          instalacao_concluida_em: inst.instalacao_concluida_em,
          instalacao_concluida_por: inst.instalacao_concluida_por,
          latitude: inst.latitude,
          longitude: inst.longitude,
          cep: inst.cep,
          endereco: inst.endereco,
          estado: inst.estado,
          cidade: inst.cidade,
          telefone_cliente: inst.telefone_cliente,
          observacoes: inst.observacoes,
          created_at: inst.created_at,
          updated_at: inst.updated_at,
          created_by: inst.created_by,
          dia_semana: diaSemana,
          equipe: inst.equipe,
          autorizado: null,
          pedido: inst.pedido,
          venda: inst.venda
        } as InstalacaoCronogramaEquipe;
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
      const ano = novaData.getFullYear();
      const mes = String(novaData.getMonth() + 1).padStart(2, '0');
      const diaData = String(novaData.getDate()).padStart(2, '0');
      const dataFormatada = `${ano}-${mes}-${diaData}`;

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

    const channel = supabase
      .channel('instalacoes_cronograma_equipes_changes')
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
