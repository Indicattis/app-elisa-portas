import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CanalAquisicao {
  id: string;
  nome: string;
  ativo: boolean;
  pago: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useCanaisAquisicao() {
  const [canais, setCanais] = useState<CanalAquisicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanais = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('canais_aquisicao')
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setCanais(data || []);
    } catch (err) {
      console.error('Erro ao buscar canais de aquisição:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanais();
  }, []);

  return {
    canais,
    loading,
    error,
    refetch: fetchCanais
  };
}