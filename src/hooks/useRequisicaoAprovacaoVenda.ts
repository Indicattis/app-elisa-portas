import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface RequisicaoAprovacaoVenda {
  id: string;
  solicitante_id: string;
  status: string;
  dados_venda: any;
  dados_produtos: any;
  dados_pagamento: any;
  dados_credito: any;
  percentual_desconto: number;
  tipo_autorizacao: string;
  aprovado_por: string | null;
  venda_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export function useRequisicaoAprovacaoVenda() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: requisicoes = [], isLoading, refetch } = useQuery({
    queryKey: ['requisicoes-aprovacao-venda'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisicoes_aprovacao_venda' as any)
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RequisicaoAprovacaoVenda[];
    },
  });

  const criarRequisicao = useMutation({
    mutationFn: async (params: {
      dados_venda: any;
      dados_produtos: any;
      dados_pagamento: any;
      dados_credito: any;
      percentual_desconto: number;
      tipo_autorizacao: string;
    }) => {
      const { error } = await supabase
        .from('requisicoes_aprovacao_venda' as any)
        .insert({
          solicitante_id: user?.id,
          dados_venda: params.dados_venda,
          dados_produtos: params.dados_produtos,
          dados_pagamento: params.dados_pagamento,
          dados_credito: params.dados_credito,
          percentual_desconto: params.percentual_desconto,
          tipo_autorizacao: params.tipo_autorizacao,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Requisição de aprovação criada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['requisicoes-aprovacao-venda'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro ao criar requisição', description: error.message });
    },
  });

  const aprovarRequisicao = useMutation({
    mutationFn: async ({ id, venda_id }: { id: string; venda_id: string }) => {
      const { error } = await supabase
        .from('requisicoes_aprovacao_venda' as any)
        .update({
          status: 'aprovada',
          aprovado_por: user?.id,
          venda_id,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Venda aprovada e criada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['requisicoes-aprovacao-venda'] });
      queryClient.invalidateQueries({ queryKey: ['aprovacoes-vendas-count'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro ao aprovar', description: error.message });
    },
  });

  const recusarRequisicao = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes?: string }) => {
      const { error } = await supabase
        .from('requisicoes_aprovacao_venda' as any)
        .update({
          status: 'recusada',
          aprovado_por: user?.id,
          observacoes,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Requisição recusada' });
      queryClient.invalidateQueries({ queryKey: ['requisicoes-aprovacao-venda'] });
      queryClient.invalidateQueries({ queryKey: ['aprovacoes-vendas-count'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro ao recusar', description: error.message });
    },
  });

  return {
    requisicoes,
    isLoading,
    refetch,
    criarRequisicao,
    aprovarRequisicao,
    recusarRequisicao,
  };
}
