import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutorizadoApto {
  id: string;
  nome: string;
  etapa: string;
  cidade: string;
  estado: string;
}

export const useAutorizadosAptos = () => {
  const [autorizados, setAutorizados] = useState<AutorizadoApto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutorizadosAptos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('autorizados')
        .select('id, nome, etapa, cidade, estado')
        .eq('ativo', true)
        .in('etapa', ['ativo', 'premium'])
        .order('nome');

      if (error) throw error;
      
      setAutorizados(data || []);
    } catch (error) {
      console.error('Error fetching autorizados aptos:', error);
      toast.error('Erro ao carregar autorizados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutorizadosAptos();
  }, []);

  return {
    autorizados,
    loading,
    refetch: fetchAutorizadosAptos,
  };
};
