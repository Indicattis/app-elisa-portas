import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EquipeInstalacao {
  id: string;
  nome: string;
  ativa: boolean;
  cor: string;
  responsavel_id?: string;
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
        .select('*')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setEquipes(data || []);
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