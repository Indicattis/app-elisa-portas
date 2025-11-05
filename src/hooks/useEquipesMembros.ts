import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EquipeMembro {
  id: string;
  equipe_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil_url?: string;
  };
}

export function useEquipesMembros(equipeId?: string) {
  const [membros, setMembros] = useState<EquipeMembro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembros = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('equipes_instalacao_membros')
        .select('*')
        .order('created_at', { ascending: false });

      if (equipeId) {
        query = query.eq('equipe_id', equipeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar dados dos usuários
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: usersData } = await supabase
          .from('admin_users')
          .select('user_id, nome, email, foto_perfil_url')
          .in('user_id', userIds);

        const membrosComUsuarios = data.map(membro => ({
          ...membro,
          user: usersData?.find(u => u.user_id === membro.user_id)
            ? {
                id: usersData.find(u => u.user_id === membro.user_id)!.user_id,
                nome: usersData.find(u => u.user_id === membro.user_id)!.nome,
                email: usersData.find(u => u.user_id === membro.user_id)!.email,
                foto_perfil_url: usersData.find(u => u.user_id === membro.user_id)?.foto_perfil_url
              }
            : undefined
        }));

        setMembros(membrosComUsuarios);
      } else {
        setMembros([]);
      }
    } catch (error) {
      console.error('Erro ao buscar membros das equipes:', error);
      toast.error('Erro ao carregar membros das equipes');
    } finally {
      setLoading(false);
    }
  };

  const adicionarMembro = async (equipeId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('equipes_instalacao_membros')
        .insert({
          equipe_id: equipeId,
          user_id: userId,
          created_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este usuário já está nesta equipe');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Membro adicionado à equipe');
      await fetchMembros();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast.error('Erro ao adicionar membro à equipe');
      return false;
    }
  };

  const removerMembro = async (membroId: string) => {
    try {
      const { error } = await supabase
        .from('equipes_instalacao_membros')
        .delete()
        .eq('id', membroId);

      if (error) throw error;

      toast.success('Membro removido da equipe');
      await fetchMembros();
      return true;
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro da equipe');
      return false;
    }
  };

  useEffect(() => {
    fetchMembros();

    // Subscribe to changes
    const channel = supabase
      .channel('equipes_instalacao_membros_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipes_instalacao_membros'
        },
        () => {
          fetchMembros();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipeId]);

  return {
    membros,
    loading,
    fetchMembros,
    adicionarMembro,
    removerMembro
  };
}
