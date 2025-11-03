import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProdutoInstalacao {
  id: string;
  tipo_produto: string;
  descricao: string;
  quantidade: number;
  valor_total: number;
  tamanho?: string;
  cor?: {
    nome: string;
    codigo_hex: string;
  };
}

export interface ParcelaInstalacao {
  id: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_pago: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  observacoes: string | null;
}

export interface InstalacaoCadastrada {
  id: string;
  nome_cliente: string;
  telefone_cliente: string | null;
  estado: string;
  cidade: string;
  tamanho: string | null;
  categoria: 'instalacao' | 'entrega' | 'correcao' | 'carregamento_agendado';
  latitude: number | null;
  longitude: number | null;
  last_geocoded_at: string | null;
  geocode_precision: string | null;
  data_instalacao: string | null;
  status: 'pendente_producao' | 'pronta_fabrica' | 'finalizada';
  tipo_instalacao: 'elisa' | 'autorizados' | null;
  responsavel_instalacao_id: string | null;
  responsavel_instalacao_nome: string | null;
  data_producao: string | null;
  justificativa_correcao: string | null;
  alterado_para_correcao_em: string | null;
  alterado_para_correcao_por: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  venda_id: string | null;
  pedido_id: string | null;
  produtos?: ProdutoInstalacao[];
  parcelas?: ParcelaInstalacao[];
  venda?: {
    id: string;
    numero_venda: string;
    valor_a_receber: number;
    pagamento_na_entrega: boolean;
    forma_pagamento: string;
    observacoes_venda: string | null;
  };
  pedido?: {
    id: string;
    numero_pedido: string;
  };
  criador?: {
    nome: string;
    foto_perfil_url?: string;
  };
}

export interface CreateInstalacaoData {
  nome_cliente: string;
  telefone_cliente?: string;
  estado: string;
  cidade: string;
  tamanho?: string;
  categoria: 'instalacao' | 'entrega' | 'correcao' | 'carregamento_agendado';
  data_instalacao?: string;
  status?: 'pendente_producao' | 'pronta_fabrica' | 'finalizada';
  tipo_instalacao?: 'elisa' | 'autorizados';
  responsavel_instalacao_id?: string;
  responsavel_instalacao_nome?: string;
  data_producao?: string;
}

export const useInstalacoesCadastradas = () => {
  const [instalacoes, setInstalacoes] = useState<InstalacaoCadastrada[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstalacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instalacoes_cadastradas')
        .select(`
          *,
          pedido:pedido_id(
            id,
            numero_pedido
          ),
          venda:venda_id(
            id,
            numero_venda,
            valor_a_receber,
            pagamento_na_entrega,
            forma_pagamento,
            observacoes_venda
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar dados dos criadores e produtos manualmente
      const instalacoesComCriadores: InstalacaoCadastrada[] = await Promise.all(
        (data || []).map(async (instalacao: any) => {
          let criador = undefined;
          let produtos: ProdutoInstalacao[] = [];
          let parcelas: ParcelaInstalacao[] = [];

          // Buscar criador
          if (instalacao.created_by) {
            const { data: userData } = await supabase
              .from('admin_users')
              .select('nome, foto_perfil_url')
              .eq('user_id', instalacao.created_by)
              .maybeSingle();
            
            criador = userData || undefined;
          }

          // Buscar dados da venda associada se houver
          if (instalacao.venda_id) {

            // Buscar produtos da venda
            const { data: produtosData } = await supabase
              .from('produtos_vendas')
              .select(`
                id,
                tipo_produto,
                descricao,
                quantidade,
                valor_total,
                tamanho,
                cor:catalogo_cores(nome, codigo_hex)
              `)
              .eq('venda_id', instalacao.venda_id);
            
            if (produtosData) {
              produtos = produtosData.map((p: any) => ({
                id: p.id,
                tipo_produto: p.tipo_produto,
                descricao: p.descricao,
                quantidade: p.quantidade,
                valor_total: p.valor_total,
                tamanho: p.tamanho,
                cor: p.cor
              }));
            }

            // Buscar parcelas de pagamento da venda
            const { data: parcelasData } = await supabase
              .from('contas_receber')
              .select('*')
              .eq('venda_id', instalacao.venda_id)
              .order('numero_parcela', { ascending: true });
            
            if (parcelasData) {
              parcelas = parcelasData.map((p: any) => ({
                id: p.id,
                numero_parcela: p.numero_parcela,
                valor_parcela: p.valor_parcela,
                valor_pago: p.valor_pago || 0,
                data_vencimento: p.data_vencimento,
                data_pagamento: p.data_pagamento,
                status: p.status,
                observacoes: p.observacoes
              }));
            }
          }
          
          return {
            ...instalacao,
            categoria: instalacao.categoria as 'instalacao' | 'entrega' | 'correcao',
            status: instalacao.status as 'pendente_producao' | 'pronta_fabrica' | 'finalizada',
            produtos,
            parcelas,
            venda: instalacao.venda || undefined,
            pedido: instalacao.pedido || undefined,
            criador
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

  const alterarParaCorrecao = async (id: string, justificativa: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .update({
          categoria: 'correcao',
          justificativa_correcao: justificativa,
          alterado_para_correcao_em: new Date().toISOString(),
          alterado_para_correcao_por: user.id
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Instalação alterada para correção com sucesso');
      await fetchInstalacoes();
    } catch (error) {
      console.error('Error alterando para correção:', error);
      toast.error('Erro ao alterar a instalação para correção');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('instalacoes_cadastradas')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso');
      await fetchInstalacoes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar o status');
    }
  };

  return {
    instalacoes,
    loading,
    fetchInstalacoes,
    createInstalacao,
    updateInstalacao,
    deleteInstalacao,
    alterarParaCorrecao,
    updateStatus,
  };
};
