import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InstalacaoCadastrada {
  id: string;
  nome_cliente: string;
  estado: string;
  cidade: string;
  tamanho: string | null;
  categoria: 'instalacao' | 'entrega' | 'correcao';
  latitude: number | null;
  longitude: number | null;
  last_geocoded_at: string | null;
  geocode_precision: string | null;
  data_instalacao: string | null;
  status: 'pendente_producao' | 'pronta_fabrica' | 'finalizada';
  tipo_instalacao: 'elisa' | 'autorizados' | null;
  responsavel_instalacao_id: string | null;
  responsavel_instalacao_nome: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  criador?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

export interface CreateInstalacaoData {
  nome_cliente: string;
  estado: string;
  cidade: string;
  tamanho?: string;
  categoria: 'instalacao' | 'entrega' | 'correcao';
  data_instalacao?: string;
  status?: 'pendente_producao' | 'pronta_fabrica' | 'finalizada';
  tipo_instalacao?: 'elisa' | 'autorizados';
  responsavel_instalacao_id?: string;
  responsavel_instalacao_nome?: string;
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
      
      // Buscar dados dos criadores manualmente
      const instalacoesComCriadores: InstalacaoCadastrada[] = await Promise.all(
        (data || []).map(async (instalacao) => {
          if (instalacao.created_by) {
            const { data: userData } = await supabase
              .from('admin_users')
              .select('nome, foto_perfil_url')
              .eq('user_id', instalacao.created_by)
              .single();
            
            return {
              ...instalacao,
              categoria: instalacao.categoria as 'instalacao' | 'entrega' | 'correcao',
              status: instalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
              criador: userData || undefined
            };
          }
          return {
            ...instalacao,
            categoria: instalacao.categoria as 'instalacao' | 'entrega' | 'correcao',
            status: instalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada'
          };
        })
      );
      
      setInstalacoes(instalacoesComCriadores);
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

      const { data_instalacao, tipo_instalacao, responsavel_instalacao_id, ...restData } = data;
      
      const { data: instalacao, error } = await supabase
        .from('instalacoes_cadastradas')
        .insert({
          ...restData,
          data_instalacao: data_instalacao && data_instalacao.trim() !== '' 
            ? data_instalacao 
            : null,
          tipo_instalacao: tipo_instalacao && tipo_instalacao.trim() !== ''
            ? tipo_instalacao
            : null,
          responsavel_instalacao_id: responsavel_instalacao_id && responsavel_instalacao_id !== '' && responsavel_instalacao_id.trim() !== ''
            ? responsavel_instalacao_id
            : null,
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
      // Sanitize optional fields if present
      const sanitizedData = {
        ...data,
        ...(data.data_instalacao !== undefined && {
          data_instalacao: data.data_instalacao && data.data_instalacao.trim() !== '' 
            ? data.data_instalacao 
            : null
        }),
        ...(data.tipo_instalacao !== undefined && {
          tipo_instalacao: data.tipo_instalacao && data.tipo_instalacao.trim() !== ''
            ? data.tipo_instalacao
            : null
        }),
        ...(data.responsavel_instalacao_id !== undefined && {
          responsavel_instalacao_id: data.responsavel_instalacao_id && data.responsavel_instalacao_id.trim() !== ''
            ? data.responsavel_instalacao_id
            : null
        })
      };
      
      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .update(sanitizedData)
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
