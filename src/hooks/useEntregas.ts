import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProdutoEntrega {
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

export interface ParcelaEntrega {
  id: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_pago: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  observacoes: string | null;
}

export interface Entrega {
  id: string;
  nome_cliente: string;
  telefone_cliente: string | null;
  estado: string;
  cidade: string;
  tamanho: string | null;
  latitude: number | null;
  longitude: number | null;
  last_geocoded_at: string | null;
  geocode_precision: string | null;
  data_entrega: string | null;
  status: 'pendente_producao' | 'em_producao' | 'em_qualidade' | 'aguardando_pintura' | 'pronta_fabrica' | 'finalizada';
  responsavel_entrega_id: string | null;
  responsavel_entrega_nome: string | null;
  data_producao: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  venda_id: string | null;
  pedido_id: string | null;
  produtos?: ProdutoEntrega[];
  parcelas?: ParcelaEntrega[];
  venda?: {
    id: string;
    numero: string;
    valor_a_receber: number;
    pagamento_na_entrega: boolean;
    forma_pagamento: string;
    observacoes: string | null;
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

export interface CreateEntregaData {
  nome_cliente: string;
  telefone_cliente?: string;
  estado: string;
  cidade: string;
  tamanho?: string;
  data_entrega?: string;
  status?: 'pendente_producao' | 'em_producao' | 'em_qualidade' | 'aguardando_pintura' | 'pronta_fabrica' | 'finalizada';
  responsavel_entrega_id?: string;
  responsavel_entrega_nome?: string;
  data_producao?: string;
}

export const useEntregas = () => {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entregas' as any)
        .select(`
          *,
          pedido:pedidos_producao!pedido_id(
            id,
            numero_pedido
          ),
          venda:vendas!venda_id(
            id,
            numero,
            valor_a_receber,
            pagamento_na_entrega,
            forma_pagamento,
            observacoes
          )
        `)
        .order('created_at', { ascending: false});

      if (error) throw error;
      
      // Buscar dados dos criadores e produtos manualmente
      const entregasComCriadores: Entrega[] = await Promise.all(
        (data || []).map(async (entrega: any) => {
          let criador = undefined;
          let produtos: ProdutoEntrega[] = [];
          let parcelas: ParcelaEntrega[] = [];

          // Buscar criador
          if (entrega.created_by) {
            const { data: userData } = await supabase
              .from('admin_users')
              .select('nome, foto_perfil_url')
              .eq('user_id', entrega.created_by)
              .maybeSingle();
            
            criador = userData || undefined;
          }

          // Buscar dados da venda associada se houver
          if (entrega.venda_id) {

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
              .eq('venda_id', entrega.venda_id);
            
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
              .eq('venda_id', entrega.venda_id)
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
            ...entrega,
            status: entrega.status as 'pendente_producao' | 'em_producao' | 'em_qualidade' | 'aguardando_pintura' | 'pronta_fabrica' | 'finalizada',
            produtos,
            parcelas,
            venda: entrega.venda || undefined,
            pedido: entrega.pedido || undefined,
            criador
          };
        })
      );
      
      setEntregas(entregasComCriadores);
    } catch (error) {
      console.error('Error fetching entregas:', error);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  const createEntrega = async (data: CreateEntregaData): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return null;
      }

      const { data_entrega, responsavel_entrega_id, ...restData } = data;
      
      const { data: entrega, error } = await supabase
        .from('entregas' as any)
        .insert({
          ...restData,
          data_entrega: data_entrega && data_entrega.trim() !== '' 
            ? data_entrega 
            : null,
          responsavel_entrega_id: responsavel_entrega_id && responsavel_entrega_id !== '' && responsavel_entrega_id.trim() !== ''
            ? responsavel_entrega_id
            : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Entrega cadastrada com sucesso');

      // Trigger geocoding apenas se entrega foi criada
      const entregaId = (entrega as any)?.id;
      if (entregaId && data.cidade && data.estado) {
        geocodeEntrega(entregaId, data.cidade, data.estado);
      }

      await fetchEntregas();
      return entregaId || null;
    } catch (error) {
      console.error('Error creating entrega:', error);
      toast.error('Erro ao cadastrar entrega');
      return null;
    }
  };

  const updateEntrega = async (id: string, data: Partial<CreateEntregaData>): Promise<boolean> => {
    try {
      // Sanitize optional fields if present
      const sanitizedData = {
        ...data,
        ...(data.data_entrega !== undefined && {
          data_entrega: data.data_entrega && data.data_entrega.trim() !== '' 
            ? data.data_entrega 
            : null
        }),
        ...(data.responsavel_entrega_id !== undefined && {
          responsavel_entrega_id: data.responsavel_entrega_id && data.responsavel_entrega_id.trim() !== ''
            ? data.responsavel_entrega_id
            : null
        })
      };
      
      const { error } = await supabase
        .from('entregas' as any)
        .update(sanitizedData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Entrega atualizada com sucesso');

      // If cidade or estado changed, trigger geocoding
      if (data.cidade || data.estado) {
        const entrega = entregas.find(e => e.id === id);
        if (entrega) {
          geocodeEntrega(
            id,
            data.cidade || entrega.cidade,
            data.estado || entrega.estado
          );
        }
      }

      await fetchEntregas();
      return true;
    } catch (error) {
      console.error('Error updating entrega:', error);
      toast.error('Erro ao atualizar entrega');
      return false;
    }
  };

  const deleteEntrega = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('entregas' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Entrega excluída com sucesso');
      await fetchEntregas();
      return true;
    } catch (error) {
      console.error('Error deleting entrega:', error);
      toast.error('Erro ao excluir entrega');
      return false;
    }
  };

  const geocodeEntrega = async (id: string, cidade: string, estado: string) => {
    try {
      console.log(`Geocoding entrega ${id}: ${cidade}, ${estado}`);
      
      const { error } = await supabase.functions.invoke('geocode-instalacao', {
        body: { id, cidade, estado, table: 'entregas' },
      });

      if (error) {
        console.error('Geocoding error:', error);
        toast.error('Erro ao geocodificar entrega');
      } else {
        toast.success('Entrega geocodificada com sucesso');
        await fetchEntregas();
      }
    } catch (error) {
      console.error('Error calling geocode function:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('entregas' as any)
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso');
      await fetchEntregas();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar o status');
    }
  };

  useEffect(() => {
    fetchEntregas();

    // Subscribe to changes
    const subscription = supabase
      .channel('entregas_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'entregas' as any
        }, 
        () => {
          fetchEntregas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    entregas,
    loading,
    fetchEntregas,
    createEntrega,
    updateEntrega,
    deleteEntrega,
    updateStatus,
  };
};
