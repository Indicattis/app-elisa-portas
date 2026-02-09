import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Estado {
  id: string;
  sigla: string;
  nome: string;
  totalAutorizados: number;
  totalCidades: number;
}

export interface AutorizadoResumo {
  id: string;
  nome: string;
  etapa: string | null;
  cidade: string | null;
  estado: string | null;
}

export interface Cidade {
  id: string;
  estado_id: string;
  nome: string;
  autorizados: AutorizadoResumo[];
}

export const useEstadosCidades = () => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState<Estado | null>(null);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [autorizadosOrfaos, setAutorizadosOrfaos] = useState<AutorizadoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // Buscar todos os estados com contadores
  const fetchEstados = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar estados cadastrados
      const { data: estadosCadastrados, error: errorEstados } = await supabase
        .from('estados_autorizados')
        .select('*')
        .order('ordem')
        .order('sigla');
      
      if (errorEstados) throw errorEstados;

      // Buscar autorizados ativos para contar
      const { data: autorizados, error: errorAutorizados } = await supabase
        .from('autorizados')
        .select('id, estado')
        .eq('ativo', true)
        .in('etapa', ['ativo', 'premium']);
      
      if (errorAutorizados) throw errorAutorizados;

      // Buscar cidades cadastradas por estado
      const { data: cidadesCadastradas, error: errorCidades } = await supabase
        .from('cidades_autorizados')
        .select('id, estado_id');
      
      if (errorCidades) throw errorCidades;

      // Montar estados com contadores
      const estadosComContadores = (estadosCadastrados || []).map(estado => {
        const totalAutorizados = (autorizados || []).filter(
          a => a.estado?.toUpperCase() === estado.sigla.toUpperCase()
        ).length;
        
        const totalCidades = (cidadesCadastradas || []).filter(
          c => c.estado_id === estado.id
        ).length;

        return {
          ...estado,
          totalAutorizados,
          totalCidades
        };
      });

      setEstados(estadosComContadores);
    } catch (error) {
      console.error('Erro ao buscar estados:', error);
      toast.error('Erro ao carregar estados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar cidades e autorizados de um estado específico
  const fetchCidadesDoEstado = useCallback(async (estado: Estado) => {
    try {
      setLoadingCidades(true);
      
      // Buscar cidades cadastradas desse estado
      const { data: cidadesCadastradas, error: errorCidades } = await supabase
        .from('cidades_autorizados')
        .select('id, estado_id, nome')
        .eq('estado_id', estado.id)
        .order('nome');
      
      if (errorCidades) throw errorCidades;

      // Buscar autorizados desse estado
      const { data: autorizados, error: errorAutorizados } = await supabase
        .from('autorizados')
        .select('id, nome, cidade, estado, etapa')
        .eq('ativo', true)
        .ilike('estado', estado.sigla)
        .in('etapa', ['ativo', 'premium'])
        .order('nome');
      
      if (errorAutorizados) throw errorAutorizados;

      // Agrupar autorizados nas cidades
      const cidadesNomes = (cidadesCadastradas || []).map(c => c.nome.toLowerCase());
      
      const cidadesComAutorizados = (cidadesCadastradas || []).map(cidade => ({
        ...cidade,
        autorizados: (autorizados || []).filter(
          a => a.cidade?.toLowerCase() === cidade.nome.toLowerCase()
        )
      }));

      // Identificar órfãos (sem cidade ou cidade não cadastrada)
      const orfaos = (autorizados || []).filter(
        a => !a.cidade || !cidadesNomes.includes(a.cidade.toLowerCase())
      );

      setCidades(cidadesComAutorizados);
      setAutorizadosOrfaos(orfaos);
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      toast.error('Erro ao carregar cidades');
    } finally {
      setLoadingCidades(false);
    }
  }, []);

  // Selecionar estado
  const selecionarEstado = useCallback((estado: Estado | null) => {
    setEstadoSelecionado(estado);
    if (estado) {
      fetchCidadesDoEstado(estado);
    } else {
      setCidades([]);
      setAutorizadosOrfaos([]);
    }
  }, [fetchCidadesDoEstado]);

  // CRUD Estados
  const criarEstado = async (sigla: string, nome: string) => {
    try {
      const { error } = await supabase
        .from('estados_autorizados')
        .insert({ sigla: sigla.toUpperCase(), nome });
      
      if (error) throw error;
      
      toast.success('Estado criado com sucesso');
      await fetchEstados();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar estado:', error);
      if (error.code === '23505') {
        toast.error('Este estado já existe');
      } else {
        toast.error('Erro ao criar estado');
      }
      return false;
    }
  };

  const editarEstado = async (id: string, sigla: string, nome: string) => {
    try {
      const { error } = await supabase
        .from('estados_autorizados')
        .update({ sigla: sigla.toUpperCase(), nome })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Estado atualizado com sucesso');
      await fetchEstados();
      if (estadoSelecionado?.id === id) {
        setEstadoSelecionado({ ...estadoSelecionado, sigla: sigla.toUpperCase(), nome });
      }
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar estado:', error);
      if (error.code === '23505') {
        toast.error('Esta sigla já está em uso');
      } else {
        toast.error('Erro ao atualizar estado');
      }
      return false;
    }
  };

  const excluirEstado = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estados_autorizados')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Estado excluído com sucesso');
      if (estadoSelecionado?.id === id) {
        setEstadoSelecionado(null);
        setCidades([]);
        setAutorizadosOrfaos([]);
      }
      await fetchEstados();
      return true;
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      toast.error('Erro ao excluir estado');
      return false;
    }
  };

  // CRUD Cidades
  const criarCidade = async (estadoId: string, nome: string) => {
    try {
      const { error } = await supabase
        .from('cidades_autorizados')
        .insert({ estado_id: estadoId, nome });
      
      if (error) throw error;
      
      toast.success('Cidade criada com sucesso');
      if (estadoSelecionado) {
        await fetchCidadesDoEstado(estadoSelecionado);
        await fetchEstados();
      }
      return true;
    } catch (error: any) {
      console.error('Erro ao criar cidade:', error);
      if (error.code === '23505') {
        toast.error('Esta cidade já existe neste estado');
      } else {
        toast.error('Erro ao criar cidade');
      }
      return false;
    }
  };

  const editarCidade = async (id: string, nome: string) => {
    try {
      const { error } = await supabase
        .from('cidades_autorizados')
        .update({ nome })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Cidade atualizada com sucesso');
      if (estadoSelecionado) {
        await fetchCidadesDoEstado(estadoSelecionado);
      }
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar cidade:', error);
      if (error.code === '23505') {
        toast.error('Esta cidade já existe neste estado');
      } else {
        toast.error('Erro ao atualizar cidade');
      }
      return false;
    }
  };

  const excluirCidade = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cidades_autorizados')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Cidade excluída com sucesso');
      if (estadoSelecionado) {
        await fetchCidadesDoEstado(estadoSelecionado);
        await fetchEstados();
      }
      return true;
    } catch (error) {
      console.error('Erro ao excluir cidade:', error);
      toast.error('Erro ao excluir cidade');
      return false;
    }
  };

  // Ações de Autorizado
  const definirPremium = async (autorizadoId: string) => {
    try {
      const { error } = await supabase
        .from('autorizados')
        .update({ etapa: 'premium' })
        .eq('id', autorizadoId);
      
      if (error) throw error;
      
      toast.success('Autorizado definido como Premium');
      if (estadoSelecionado) {
        await fetchCidadesDoEstado(estadoSelecionado);
      }
      return true;
    } catch (error) {
      console.error('Erro ao definir premium:', error);
      toast.error('Erro ao definir premium');
      return false;
    }
  };

  const removerPremium = async (autorizadoId: string) => {
    try {
      const { error } = await supabase
        .from('autorizados')
        .update({ etapa: 'ativo' })
        .eq('id', autorizadoId);
      
      if (error) throw error;
      
      toast.success('Premium removido');
      if (estadoSelecionado) {
        await fetchCidadesDoEstado(estadoSelecionado);
      }
      return true;
    } catch (error) {
      console.error('Erro ao remover premium:', error);
      toast.error('Erro ao remover premium');
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
      if (estadoSelecionado) {
        await fetchCidadesDoEstado(estadoSelecionado);
        await fetchEstados();
      }
      return true;
    } catch (error) {
      console.error('Erro ao excluir autorizado:', error);
      toast.error('Erro ao excluir autorizado');
      return false;
    }
  };

  const reordenarEstados = async (estadosReordenados: Estado[]) => {
    try {
      const updates = estadosReordenados.map((estado, index) => 
        supabase
          .from('estados_autorizados')
          .update({ ordem: index })
          .eq('id', estado.id)
      );
      await Promise.all(updates);
      setEstados(estadosReordenados.map((e, i) => ({ ...e, ordem: i })));
    } catch (error) {
      console.error('Erro ao reordenar estados:', error);
      toast.error('Erro ao reordenar estados');
      await fetchEstados();
    }
  };

  useEffect(() => {
    fetchEstados();
  }, [fetchEstados]);

  return {
    estados,
    estadoSelecionado,
    selecionarEstado,
    cidades,
    autorizadosOrfaos,
    loading,
    loadingCidades,
    criarEstado,
    editarEstado,
    excluirEstado,
    criarCidade,
    editarCidade,
    excluirCidade,
    definirPremium,
    removerPremium,
    excluirAutorizado,
    reordenarEstados,
    refetch: fetchEstados
  };
};
