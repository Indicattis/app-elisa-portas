import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OrdemCarregamento } from '@/types/ordemCarregamento';

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

export interface InstalacaoCadastrada extends OrdemCarregamento {
  produtos?: ProdutoInstalacao[];
  parcelas?: ParcelaInstalacao[];
  criador?: {
    nome: string;
    foto_perfil_url?: string;
  };
  // Campos compatíveis com código legado
  telefone_cliente?: string | null;
  estado?: string | null;
  cidade?: string | null;
  data_producao?: string | null;
  data_instalacao?: string | null; // Alias para data_carregamento
  tipo_instalacao?: 'elisa' | 'autorizados' | null; // Alias para tipo_carregamento
  responsavel_instalacao_nome?: string | null; // Alias para responsavel_carregamento_nome
  responsavel_instalacao_id?: string | null; // Alias para responsavel_carregamento_id
  instalacao_concluida?: boolean; // Alias para carregamento_concluido
  instalacao_concluida_em?: string | null; // Alias para carregamento_concluido_em
}

export interface CreateInstalacaoData {
  nome_cliente: string;
  data_carregamento?: string;
  data_instalacao?: string; // Alias para data_carregamento
  hora_carregamento?: string;
  status?: string;
  tipo_carregamento?: 'elisa' | 'autorizados';
  tipo_instalacao?: 'elisa' | 'autorizados'; // Alias para tipo_carregamento
  responsavel_carregamento_id?: string;
  responsavel_carregamento_nome?: string;
  responsavel_instalacao_id?: string; // Alias
  responsavel_instalacao_nome?: string; // Alias
  pedido_id?: string;
  venda_id?: string;
  telefone_cliente?: string;
  estado?: string;
  cidade?: string;
}

export const useInstalacoesCadastradas = () => {
  const [instalacoes, setInstalacoes] = useState<InstalacaoCadastrada[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstalacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ordens_carregamento')
        .select(`
          *,
          pedido:pedidos_producao!pedido_id(
            id,
            numero_pedido,
            etapa_atual
          ),
          venda:vendas!venda_id(
            id,
            cliente_nome,
            cliente_telefone,
            estado,
            cidade,
            cep,
            endereco_completo,
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
        (data || []).map(async (ordem: any) => {
          let criador = undefined;
          let produtos: ProdutoInstalacao[] = [];
          let parcelas: ParcelaInstalacao[] = [];

          // Buscar criador
          if (ordem.created_by) {
            const { data: userData } = await supabase
              .from('admin_users')
              .select('nome, foto_perfil_url')
              .eq('user_id', ordem.created_by)
              .maybeSingle();
            
            criador = userData || undefined;
          }

          // Buscar dados da venda associada se houver
          if (ordem.venda_id) {
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
              .eq('venda_id', ordem.venda_id);
            
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
              .eq('venda_id', ordem.venda_id)
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
            ...ordem,
            produtos,
            parcelas,
            venda: ordem.venda || undefined,
            pedido: ordem.pedido || undefined,
            criador,
            telefone_cliente: ordem.venda?.cliente_telefone,
            estado: ordem.venda?.estado,
            cidade: ordem.venda?.cidade,
            // Aliases para compatibilidade
            data_instalacao: ordem.data_carregamento,
            tipo_instalacao: ordem.tipo_carregamento,
            responsavel_instalacao_nome: ordem.responsavel_carregamento_nome,
            responsavel_instalacao_id: ordem.responsavel_carregamento_id,
            instalacao_concluida: ordem.carregamento_concluido,
            instalacao_concluida_em: ordem.carregamento_concluido_em,
          };
        })
      );
      
      setInstalacoes(instalacoesComCriadores);
    } catch (error) {
      console.error('Error fetching ordens carregamento:', error);
      toast.error('Erro ao carregar ordens de carregamento');
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

      const dataCarregamento = data.data_carregamento || data.data_instalacao;
      const tipoCarregamento = data.tipo_carregamento || data.tipo_instalacao;
      const responsavelId = data.responsavel_carregamento_id || data.responsavel_instalacao_id;
      const responsavelNome = data.responsavel_carregamento_nome || data.responsavel_instalacao_nome;

      const { data: ordem, error } = await supabase
        .from('ordens_carregamento')
        .insert([{
          nome_cliente: data.nome_cliente,
          data_carregamento: dataCarregamento && dataCarregamento.trim() !== '' ? dataCarregamento : null,
          hora_carregamento: data.hora_carregamento || null,
          hora: data.hora_carregamento || '08:00',
          venda_id: data.venda_id || null,
          pedido_id: data.pedido_id || null,
          tipo_carregamento: tipoCarregamento && tipoCarregamento.trim() !== '' ? tipoCarregamento : null,
          responsavel_carregamento_id: responsavelId && responsavelId !== '' ? responsavelId : null,
          responsavel_carregamento_nome: responsavelNome || null,
          status: data.status || 'pronta_fabrica',
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Ordem de carregamento cadastrada com sucesso');

      await fetchInstalacoes();
      return ordem?.id || null;
    } catch (error) {
      console.error('Error creating ordem carregamento:', error);
      toast.error('Erro ao cadastrar ordem de carregamento');
      return null;
    }
  };

  const updateInstalacao = async (id: string, data: Partial<CreateInstalacaoData>): Promise<boolean> => {
    try {
      const sanitizedData: any = {};

      // Mapear campos com aliases
      const dataCarregamento = data.data_carregamento || data.data_instalacao;
      const tipoCarregamento = data.tipo_carregamento || data.tipo_instalacao;
      const responsavelId = data.responsavel_carregamento_id || data.responsavel_instalacao_id;
      const responsavelNome = data.responsavel_carregamento_nome || data.responsavel_instalacao_nome;

      if (data.nome_cliente) sanitizedData.nome_cliente = data.nome_cliente;

      if (dataCarregamento !== undefined) {
        sanitizedData.data_carregamento = dataCarregamento && dataCarregamento.trim() !== '' 
          ? dataCarregamento 
          : null;
      }
      
      if (data.hora_carregamento !== undefined) {
        sanitizedData.hora_carregamento = data.hora_carregamento;
        sanitizedData.hora = data.hora_carregamento;
      }

      if (tipoCarregamento !== undefined) {
        sanitizedData.tipo_carregamento = tipoCarregamento && tipoCarregamento.trim() !== ''
          ? tipoCarregamento
          : null;
      }

      if (responsavelId !== undefined) {
        sanitizedData.responsavel_carregamento_id = responsavelId && responsavelId.trim() !== ''
          ? responsavelId
          : null;
      }

      if (responsavelNome !== undefined) {
        sanitizedData.responsavel_carregamento_nome = responsavelNome;
      }

      if (data.status !== undefined) {
        sanitizedData.status = data.status;
      }
      
      const { error } = await supabase
        .from('ordens_carregamento')
        .update(sanitizedData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Ordem de carregamento atualizada com sucesso');

      await fetchInstalacoes();
      return true;
    } catch (error) {
      console.error('Error updating ordem carregamento:', error);
      toast.error('Erro ao atualizar ordem de carregamento');
      return false;
    }
  };

  const deleteInstalacao = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ordens_carregamento')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Ordem de carregamento excluída com sucesso');
      await fetchInstalacoes();
      return true;
    } catch (error) {
      console.error('Error deleting ordem carregamento:', error);
      toast.error('Erro ao excluir ordem de carregamento');
      return false;
    }
  };

  const geocodeInstalacao = async (id: string, cidade: string, estado: string) => {
    try {
      console.log(`Geocoding ordem ${id}: ${cidade}, ${estado}`);
      
      toast.info('Geocodificando ordem...');
      
      const { error } = await supabase.functions.invoke('geocode-instalacao', {
        body: { id, cidade, estado },
      });

      if (error) {
        console.error('Geocoding error:', error);
        toast.error('Erro ao geocodificar ordem');
        return false;
      } else {
        toast.success('Ordem geocodificada com sucesso');
        await fetchInstalacoes();
        return true;
      }
    } catch (error) {
      console.error('Error calling geocode function:', error);
    }
  };

  useEffect(() => {
    fetchInstalacoes();

    // Subscribe to changes
    const subscription = supabase
      .channel('ordens_carregamento_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ordens_carregamento' 
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

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('ordens_carregamento')
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

  const concluirInstalacao = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('concluir_ordem_carregamento', {
        p_ordem_id: id
      });

      if (error) throw error;

      toast.success('Ordem de carregamento concluída e pedido finalizado com sucesso!');
      await fetchInstalacoes();
      return true;
    } catch (error: any) {
      console.error('Error concluindo ordem carregamento:', error);
      toast.error(error.message || 'Erro ao concluir ordem de carregamento');
      return false;
    }
  };

  return {
    instalacoes,
    loading,
    fetchInstalacoes,
    createInstalacao,
    updateInstalacao,
    deleteInstalacao,
    updateStatus,
    concluirInstalacao,
    geocodeInstalacao,
  };
};
