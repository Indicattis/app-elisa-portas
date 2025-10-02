import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PortaVenda {
  id?: string;
  tamanho: string;
  cor_id?: string;
  valor_produto: number;
  valor_pintura: number;
  valor_frete: number;
  valor_instalacao: number;
  desconto_percentual: number;
}

export interface VendaFormData {
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string;
  estado: string;
  cidade: string;
  cep?: string;
  bairro?: string;
  publico_alvo: string;
  forma_pagamento: string;
  observacoes_venda?: string;
  data_venda?: string;
}

export function useVendas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          portas:portas_vendas(
            *,
            cor:catalogo_cores(nome, codigo_hex)
          ),
          atendente:admin_users!atendente_id(nome, foto_perfil_url)
        `)
        .order('data_venda', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createVendaMutation = useMutation({
    mutationFn: async ({ vendaData, portas }: { vendaData: VendaFormData, portas: PortaVenda[] }) => {
      if (portas.length === 0) {
        throw new Error('É necessário adicionar pelo menos uma porta');
      }

      // 1. Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 2. Buscar admin_user correspondente
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (adminError || !adminUser) {
        throw new Error('Usuário não encontrado no sistema');
      }

      // 3. Calcular totais das portas
      const totais = portas.reduce((acc, porta) => {
        const valorComDesconto = (
          porta.valor_produto + 
          porta.valor_pintura + 
          porta.valor_instalacao
        ) * (1 - (porta.desconto_percentual || 0) / 100);
        
        return {
          valor_produto: acc.valor_produto + porta.valor_produto,
          valor_pintura: acc.valor_pintura + porta.valor_pintura,
          valor_instalacao: acc.valor_instalacao + porta.valor_instalacao,
          valor_frete: acc.valor_frete + porta.valor_frete,
          valor_total: acc.valor_total + valorComDesconto + porta.valor_frete
        };
      }, {
        valor_produto: 0,
        valor_pintura: 0,
        valor_instalacao: 0,
        valor_frete: 0,
        valor_total: 0
      });

      // 4. Criar venda com valores calculados
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert([{
          ...vendaData,
          atendente_id: adminUser.id,
          data_venda: vendaData.data_venda || new Date().toISOString(),
          valor_produto: totais.valor_produto,
          valor_pintura: totais.valor_pintura,
          valor_instalacao: totais.valor_instalacao,
          valor_frete: totais.valor_frete,
          valor_venda: totais.valor_total
        }])
        .select()
        .single();
      
      if (vendaError) throw vendaError;

      // 5. Criar portas
      const portasComVendaId = portas.map(porta => ({
        ...porta,
        venda_id: venda.id
      }));
      
      const { error: portasError } = await supabase
        .from('portas_vendas')
        .insert(portasComVendaId);
      
      if (portasError) throw portasError;

      return venda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['contador-vendas'] });
      queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
      toast({
        title: 'Sucesso',
        description: 'Venda criada com sucesso! Instalação e contador atualizados automaticamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar venda',
        description: error.message,
      });
    }
  });

  const deleteVendaMutation = useMutation({
    mutationFn: async (vendaId: string) => {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', vendaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Sucesso',
        description: 'Venda excluída com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir venda',
        description: error.message,
      });
    }
  });

  return {
    vendas,
    isLoading,
    refetch,
    createVenda: createVendaMutation.mutateAsync,
    deleteVenda: deleteVendaMutation.mutateAsync,
    isCreating: createVendaMutation.isPending,
    isDeleting: deleteVendaMutation.isPending
  };
}
