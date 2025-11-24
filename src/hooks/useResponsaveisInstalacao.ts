import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ResponsavelInstalacao } from '@/types/instalacao';
import { toast } from 'sonner';

export function useResponsaveisInstalacao() {
  const [responsaveis, setResponsaveis] = useState<ResponsavelInstalacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponsaveis();
  }, []);

  const fetchResponsaveis = async () => {
    try {
      setLoading(true);

      // Buscar equipes internas
      const { data: equipesData, error: equipesError } = await supabase
        .from('equipes_instalacao')
        .select('*')
        .eq('ativa', true)
        .order('nome');

      if (equipesError) throw equipesError;

      // Buscar autorizados
      const { data: autorizadosData, error: autorizadosError } = await supabase
        .from('autorizados')
        .select('id, nome, cidade, estado')
        .eq('ativo', true)
        .order('nome');

      if (autorizadosError) throw autorizadosError;

      // Unificar em uma lista
      const equipesInternas: ResponsavelInstalacao[] = (equipesData || []).map(eq => ({
        tipo: 'equipe_interna' as const,
        id: eq.id,
        nome: eq.nome,
        cor: eq.cor || '#3B82F6'
      }));

      const autorizados: ResponsavelInstalacao[] = (autorizadosData || []).map(aut => ({
        tipo: 'autorizado' as const,
        id: aut.id,
        nome: aut.nome,
        cidade: aut.cidade,
        estado: aut.estado
      }));

      setResponsaveis([...equipesInternas, ...autorizados]);
    } catch (error) {
      console.error('Erro ao buscar responsáveis:', error);
      toast.error('Erro ao carregar responsáveis');
    } finally {
      setLoading(false);
    }
  };

  return {
    responsaveis,
    loading,
    fetchResponsaveis
  };
}
