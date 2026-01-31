import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutorizadoComPrecos {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  etapa: string | null;
  vendedor_nome: string | null;
  precos: {
    P: number;
    G: number;
    GG: number;
  };
}

export interface PrecosInput {
  P: number;
  G: number;
  GG: number;
}

export const useAutorizadosPrecos = () => {
  const [autorizados, setAutorizados] = useState<AutorizadoComPrecos[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutorizadosComPrecos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar autorizados ativos com etapa 'ativo' ou 'premium'
      const { data: autorizadosData, error: autorizadosError } = await supabase
        .from('autorizados')
        .select('id, nome, cidade, estado, etapa, vendedor_id')
        .eq('ativo', true)
        .in('etapa', ['ativo', 'premium'])
        .order('nome');

      if (autorizadosError) throw autorizadosError;
      
      // Buscar todos os preços
      const { data: precosData, error: precosError } = await supabase
        .from('autorizado_precos_portas')
        .select('autorizado_id, tamanho, valor');

      if (precosError) throw precosError;

      // Buscar vendedores únicos
      const vendedorIds = [...new Set(
        (autorizadosData || [])
          .map(a => a.vendedor_id)
          .filter((id): id is string => !!id)
      )];

      let vendedoresMap = new Map<string, string>();
      if (vendedorIds.length > 0) {
        const { data: vendedoresData } = await supabase
          .from('admin_users')
          .select('id, nome')
          .in('id', vendedorIds);
        
        vendedoresData?.forEach(v => {
          vendedoresMap.set(v.id, v.nome);
        });
      }

      // Mapear preços por autorizado
      const precosMap = new Map<string, PrecosInput>();
      precosData?.forEach((preco) => {
        const existing = precosMap.get(preco.autorizado_id) || { P: 0, G: 0, GG: 0 };
        existing[preco.tamanho as keyof PrecosInput] = Number(preco.valor);
        precosMap.set(preco.autorizado_id, existing);
      });

      // Combinar dados
      const resultado: AutorizadoComPrecos[] = (autorizadosData || []).map((aut) => ({
        id: aut.id,
        nome: aut.nome,
        cidade: aut.cidade || '',
        estado: aut.estado || '',
        etapa: aut.etapa,
        vendedor_nome: aut.vendedor_id ? vendedoresMap.get(aut.vendedor_id) || null : null,
        precos: precosMap.get(aut.id) || { P: 0, G: 0, GG: 0 },
      }));

      setAutorizados(resultado);
    } catch (error) {
      console.error('Error fetching autorizados com precos:', error);
      toast.error('Erro ao carregar autorizados');
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertPrecos = async (autorizadoId: string, precos: PrecosInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const tamanhos: (keyof PrecosInput)[] = ['P', 'G', 'GG'];
      
      for (const tamanho of tamanhos) {
        const { error } = await supabase
          .from('autorizado_precos_portas')
          .upsert({
            autorizado_id: autorizadoId,
            tamanho,
            valor: precos[tamanho],
            created_by: user?.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'autorizado_id,tamanho',
          });

        if (error) throw error;
      }

      toast.success('Preços atualizados com sucesso');
      await fetchAutorizadosComPrecos();
      return true;
    } catch (error) {
      console.error('Error upserting precos:', error);
      toast.error('Erro ao salvar preços');
      return false;
    }
  };

  const excluirAutorizado = async (autorizadoId: string) => {
    try {
      const { error } = await supabase
        .from('autorizados')
        .update({ ativo: false })
        .eq('id', autorizadoId);

      if (error) throw error;

      toast.success('Autorizado excluído');
      await fetchAutorizadosComPrecos();
      return true;
    } catch (error) {
      console.error('Error deleting autorizado:', error);
      toast.error('Erro ao excluir autorizado');
      return false;
    }
  };

  useEffect(() => {
    fetchAutorizadosComPrecos();
  }, [fetchAutorizadosComPrecos]);

  return {
    autorizados,
    loading,
    refetch: fetchAutorizadosComPrecos,
    upsertPrecos,
    excluirAutorizado,
  };
};
