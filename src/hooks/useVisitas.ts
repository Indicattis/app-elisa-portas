import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VisitaTecnica, VisitaTecnicaWithLead, CreateVisitaData } from '@/types/visita';
import { useToast } from '@/hooks/use-toast';

export function useVisitas() {
  const [visitas, setVisitas] = useState<VisitaTecnicaWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVisitas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visitas_tecnicas')
        .select(`
          *,
          lead:elisaportas_leads!visitas_tecnicas_lead_id_fkey (
            nome,
            telefone,
            cidade,
            endereco_rua,
            endereco_numero,
            endereco_bairro,
            endereco_cep
          )
        `)
        .order('data_visita', { ascending: true });

      if (error) throw error;

      // Buscar nomes dos usuários
      const userIds = [...new Set([
        ...data.map(v => v.responsavel_id),
        ...data.map(v => v.created_by)
      ])];

      const { data: users, error: usersError } = await supabase
        .from('admin_users')
        .select('user_id, nome')
        .in('user_id', userIds);

      if (usersError) throw usersError;

      const userMap = new Map(users.map(u => [u.user_id, u.nome]));

      const visitasWithNames = data.map(visita => ({
        ...visita,
        responsavel_nome: userMap.get(visita.responsavel_id) || 'Usuário não encontrado',
        created_by_nome: userMap.get(visita.created_by) || 'Usuário não encontrado'
      }));

      setVisitas(visitasWithNames);
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar visitas técnicas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createVisita = async (data: CreateVisitaData) => {
    try {
      const { error } = await supabase
        .from('visitas_tecnicas')
        .insert({
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Visita técnica criada com sucesso",
      });

      fetchVisitas();
      return true;
    } catch (error) {
      console.error('Erro ao criar visita:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar visita técnica",
        variant: "destructive",
      });
      return false;
    }
  };

  const marcarConcluida = async (visitaId: string) => {
    try {
      const { error } = await supabase
        .from('visitas_tecnicas')
        .update({ status: 'concluida' })
        .eq('id', visitaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Visita marcada como concluída",
      });

      fetchVisitas();
    } catch (error) {
      console.error('Erro ao marcar visita como concluída:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar visita",
        variant: "destructive",
      });
    }
  };

  const cancelarVisita = async (visitaId: string) => {
    try {
      const { error } = await supabase
        .from('visitas_tecnicas')
        .update({ status: 'cancelada' })
        .eq('id', visitaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Visita cancelada",
      });

      fetchVisitas();
    } catch (error) {
      console.error('Erro ao cancelar visita:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar visita",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, []);

  return {
    visitas,
    loading,
    fetchVisitas,
    createVisita,
    marcarConcluida,
    cancelarVisita
  };
}