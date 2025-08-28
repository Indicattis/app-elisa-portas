import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PontoInstalacao {
  id: string;
  equipe_id: string;
  cidade: string;
  semana_inicio: string;
  dia_semana: number;
  observacoes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function usePontosInstalacao(semanaInicio: Date) {
  const [pontos, setPontos] = useState<PontoInstalacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPontos = async () => {
    try {
      const semanaFormatada = format(semanaInicio, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('pontos_instalacao')
        .select('*')
        .eq('semana_inicio', semanaFormatada)
        .order('dia_semana');

      if (error) throw error;
      setPontos(data || []);
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      toast.error('Erro ao carregar pontos de instalação');
    } finally {
      setLoading(false);
    }
  };

  const createPonto = async (dados: {
    equipe_id: string;
    cidade: string;
    dia_semana: number;
    observacoes?: string;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const semanaFormatada = format(semanaInicio, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('pontos_instalacao')
        .insert([{
          ...dados,
          semana_inicio: semanaFormatada,
          created_by: userData.user.id
        }]);

      if (error) throw error;
      
      toast.success('Ponto de instalação criado com sucesso');
      fetchPontos();
      return true;
    } catch (error) {
      console.error('Erro ao criar ponto:', error);
      toast.error('Erro ao criar ponto de instalação');
      return false;
    }
  };

  const updatePonto = async (
    id: string, 
    equipId: string, 
    cidade: string, 
    diaSemana: number
  ) => {
    try {
      const { error } = await supabase
        .from('pontos_instalacao')
        .update({
          equipe_id: equipId,
          cidade,
          dia_semana: diaSemana
        })
        .eq('id', id);

      if (error) throw error;
      
      fetchPontos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar ponto:', error);
      toast.error('Erro ao mover ponto de instalação');
      return false;
    }
  };

  const deletePonto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pontos_instalacao')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Ponto de instalação removido');
      fetchPontos();
      return true;
    } catch (error) {
      console.error('Erro ao deletar ponto:', error);
      toast.error('Erro ao remover ponto de instalação');
      return false;
    }
  };

  useEffect(() => {
    fetchPontos();
  }, [semanaInicio]);

  return {
    pontos,
    loading,
    fetchPontos,
    createPonto,
    updatePonto,
    deletePonto
  };
}