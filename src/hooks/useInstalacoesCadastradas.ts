import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InstalacaoCadastrada {
  id: string;
  nome_cliente: string;
  estado: string;
  cidade: string;
  tamanho: string | null;
  latitude: number | null;
  longitude: number | null;
  last_geocoded_at: string | null;
  geocode_precision: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateInstalacaoData {
  nome_cliente: string;
  estado: string;
  cidade: string;
  tamanho?: string;
}

export const useInstalacoesCadastradas = () => {
  const [instalacoes, setInstalacoes] = useState<InstalacaoCadastrada[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstalacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instalacoes_cadastradas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstalacoes(data || []);
    } catch (error) {
      console.error('Error fetching instalações:', error);
      toast.error('Erro ao carregar instalações');
    } finally {
      setLoading(false);
    }
  };

  const createInstalacao = async (data: CreateInstalacaoData): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      const { data: instalacao, error } = await supabase
        .from('instalacoes_cadastradas')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Instalação cadastrada com sucesso');

      // Trigger geocoding
      if (instalacao?.id) {
        geocodeInstalacao(instalacao.id, data.cidade, data.estado);
      }

      await fetchInstalacoes();
      return instalacao?.id || null;
    } catch (error) {
      console.error('Error creating instalação:', error);
      toast.error('Erro ao cadastrar instalação');
      return null;
    }
  };

  const updateInstalacao = async (id: string, data: Partial<CreateInstalacaoData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Instalação atualizada com sucesso');

      // If cidade or estado changed, trigger geocoding
      if (data.cidade || data.estado) {
        const instalacao = instalacoes.find(i => i.id === id);
        if (instalacao) {
          geocodeInstalacao(
            id,
            data.cidade || instalacao.cidade,
            data.estado || instalacao.estado
          );
        }
      }

      await fetchInstalacoes();
      return true;
    } catch (error) {
      console.error('Error updating instalação:', error);
      toast.error('Erro ao atualizar instalação');
      return false;
    }
  };

  const deleteInstalacao = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Instalação excluída com sucesso');
      await fetchInstalacoes();
      return true;
    } catch (error) {
      console.error('Error deleting instalação:', error);
      toast.error('Erro ao excluir instalação');
      return false;
    }
  };

  const geocodeInstalacao = async (id: string, cidade: string, estado: string) => {
    try {
      console.log(`Geocoding instalação ${id}: ${cidade}, ${estado}`);
      
      const { error } = await supabase.functions.invoke('geocode-instalacao', {
        body: { id, cidade, estado },
      });

      if (error) {
        console.error('Geocoding error:', error);
        toast.error('Erro ao geocodificar instalação');
      } else {
        toast.success('Instalação geocodificada com sucesso');
        await fetchInstalacoes();
      }
    } catch (error) {
      console.error('Error calling geocode function:', error);
    }
  };

  useEffect(() => {
    fetchInstalacoes();

    // Subscribe to changes
    const subscription = supabase
      .channel('instalacoes_cadastradas_changes')
      .on('postgres_changes', 
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
      subscription.unsubscribe();
    };
  }, []);

  return {
    instalacoes,
    loading,
    fetchInstalacoes,
    createInstalacao,
    updateInstalacao,
    deleteInstalacao,
  };
};
