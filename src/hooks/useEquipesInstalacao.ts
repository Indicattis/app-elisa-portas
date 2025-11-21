import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EquipeInstalacao {
  id: string;
  nome: string;
  ativa: boolean;
  cor: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  responsavel_foto?: string;
  membros?: Array<{
    id: string;
    nome: string;
    foto_perfil_url?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export function useEquipesInstalacao() {
  const [equipes, setEquipes] = useState<EquipeInstalacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipes = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes_instalacao')
        .select(`
          *,
          responsavel:responsavel_id (
            nome,
            foto_perfil_url
          )
        `)
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      
      // Buscar membros de cada equipe
      const equipesComDetalhes = await Promise.all((data || []).map(async (equipe: any) => {
        // Buscar IDs dos membros
        const { data: membrosData } = await supabase
          .from('equipes_instalacao_membros')
          .select('user_id')
          .eq('equipe_id', equipe.id);

        let membros: Array<{ id: string; nome: string; foto_perfil_url?: string }> = [];
        
        if (membrosData && membrosData.length > 0) {
          const userIds = membrosData.map(m => m.user_id);
          
          // Buscar detalhes dos usuários
          const { data: usersData } = await supabase
            .from('admin_users')
            .select('id, nome, foto_perfil_url')
            .in('user_id', userIds);

          // Filtrar o responsável dos membros para não duplicar
          membros = (usersData || [])
            .filter((u: any) => u.id !== equipe.responsavel_id)
            .map((u: any) => ({
              id: u.id,
              nome: u.nome,
              foto_perfil_url: u.foto_perfil_url
            }));
        }

        return {
          ...equipe,
          responsavel_nome: equipe.responsavel?.nome,
          responsavel_foto: equipe.responsavel?.foto_perfil_url,
          membros
        };
      }));
      
      setEquipes(equipesComDetalhes);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      toast.error('Erro ao carregar equipes de instalação');
    } finally {
      setLoading(false);
    }
  };

  const createEquipe = async (dados: {
    nome: string;
    cor: string;
    responsavel_id?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('equipes_instalacao')
        .insert([dados]);

      if (error) throw error;
      
      toast.success('Equipe criada com sucesso');
      fetchEquipes();
      return true;
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      toast.error('Erro ao criar equipe');
      return false;
    }
  };

  const updateEquipe = async (id: string, dados: Partial<EquipeInstalacao>) => {
    try {
      const { error } = await supabase
        .from('equipes_instalacao')
        .update(dados)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Equipe atualizada com sucesso');
      fetchEquipes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      toast.error('Erro ao atualizar equipe');
      return false;
    }
  };

  const deleteEquipe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipes_instalacao')
        .update({ ativa: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Equipe desativada com sucesso');
      fetchEquipes();
      return true;
    } catch (error) {
      console.error('Erro ao desativar equipe:', error);
      toast.error('Erro ao desativar equipe');
      return false;
    }
  };

  useEffect(() => {
    fetchEquipes();

    // Setup real-time subscription with unique channel name
    const channelName = `equipes-instalacao-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipes_instalacao'
        },
        (payload) => {
          console.log('Equipe changed:', payload);
          fetchEquipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    equipes,
    loading,
    fetchEquipes,
    createEquipe,
    updateEquipe,
    deleteEquipe
  };
}