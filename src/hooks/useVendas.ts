import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProdutoVenda {
  id?: string;
  tipo_produto: 'porta' | 'acessorio' | 'adicional';
  tamanho?: string;
  cor_id?: string;
  acessorio_id?: string;
  adicional_id?: string;
  valor_produto: number;
  valor_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  tipo_desconto: 'percentual' | 'valor';
  desconto_percentual: number;
  desconto_valor: number;
  quantidade: number;
  descricao?: string;
}

// Manter compatibilidade com código existente
export type PortaVenda = ProdutoVenda;

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
  valor_frete?: number;
  canal_aquisicao_id?: string;
  data_prevista_entrega?: string;
  tipo_entrega?: string;
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
    mutationFn: async ({ vendaData, portas }: { vendaData: VendaFormData, portas: ProdutoVenda[] }) => {
      if (portas.length === 0) {
        throw new Error('É necessário adicionar pelo menos um produto');
      }

      // 1. Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('🔍 User ID from auth:', user.id);

      // 2. Buscar admin_user correspondente
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id, nome')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('✅ Admin user found:', adminUser, 'Error:', adminError);
      
      // Verificar se o admin_user.id realmente existe na tabela
      if (adminUser) {
        const { data: verifyAdmin, error: verifyError } = await supabase
          .from('admin_users')
          .select('id, nome')
          .eq('id', adminUser.id)
          .maybeSingle();
        console.log('🔎 Verification - Admin user exists:', verifyAdmin, 'Error:', verifyError);
      }
      
      if (adminError) {
        throw new Error(`Erro ao buscar usuário: ${adminError.message}`);
      }
      
      if (!adminUser) {
        throw new Error('Usuário não encontrado no sistema. Por favor, entre em contato com o administrador.');
      }

      // 3. Calcular totais dos produtos
      const totais = portas.reduce((acc, produto) => {
        const valorBase = (
          produto.valor_produto + 
          produto.valor_pintura + 
          produto.valor_instalacao
        ) * (produto.quantidade || 1);
        
        const descontoAplicado = produto.tipo_desconto === 'valor' 
          ? (produto.desconto_valor || 0)
          : valorBase * ((produto.desconto_percentual || 0) / 100);
        
        const valorComDesconto = valorBase - descontoAplicado;
        
        return {
          valor_produto: acc.valor_produto + (produto.valor_produto * (produto.quantidade || 1)),
          valor_pintura: acc.valor_pintura + (produto.valor_pintura * (produto.quantidade || 1)),
          valor_instalacao: acc.valor_instalacao + (produto.valor_instalacao * (produto.quantidade || 1)),
          valor_total: acc.valor_total + valorComDesconto
        };
      }, {
        valor_produto: 0,
        valor_pintura: 0,
        valor_instalacao: 0,
        valor_total: 0
      });

      const valor_frete = vendaData.valor_frete || 0;

      // 4. Criar venda com valores calculados
      const vendaPayload = {
        ...vendaData,
        atendente_id: adminUser.id,
        data_venda: vendaData.data_venda || new Date().toISOString(),
        valor_produto: totais.valor_produto,
        valor_pintura: totais.valor_pintura,
        valor_instalacao: totais.valor_instalacao,
        valor_frete: valor_frete,
        valor_venda: totais.valor_total + valor_frete
      };

      console.log('Venda payload:', vendaPayload);
      console.log('atendente_id being sent:', adminUser.id);

      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert([vendaPayload])
        .select()
        .single();
      
      if (vendaError) throw vendaError;

      // 5. Criar produtos da venda
      const produtosComVendaId = portas.map(produto => ({
        venda_id: venda.id,
        tipo_produto: produto.tipo_produto,
        tamanho: produto.tamanho || '',
        cor_id: produto.cor_id || null,
        acessorio_id: produto.acessorio_id || null,
        adicional_id: produto.adicional_id || null,
        valor_produto: produto.valor_produto,
        valor_pintura: produto.valor_pintura,
        valor_instalacao: produto.valor_instalacao,
        valor_frete: produto.valor_frete,
        tipo_desconto: produto.tipo_desconto,
        desconto_percentual: produto.desconto_percentual,
        desconto_valor: produto.desconto_valor,
        quantidade: produto.quantidade,
        descricao: produto.descricao || null
      }));
      
      const { error: portasError } = await supabase
        .from('portas_vendas')
        .insert(produtosComVendaId);
      
      if (portasError) throw portasError;

      // 6. Atualizar tamanho da instalação com os tamanhos concatenados das portas
      const tamanhosConcatenados = portas.map(p => p.tamanho).join(', ');
      
      const updateData: any = { tamanho: tamanhosConcatenados };
      if (vendaData.data_prevista_entrega) {
        updateData.data_instalacao = vendaData.data_prevista_entrega;
      }
      if (vendaData.tipo_entrega) {
        updateData.categoria = vendaData.tipo_entrega.toLowerCase();
      }
      
      const { error: instalacaoError } = await supabase
        .from('instalacoes_cadastradas')
        .update(updateData)
        .eq('nome_cliente', venda.cliente_nome)
        .eq('telefone_cliente', venda.cliente_telefone)
        .order('created_at', { ascending: false })
        .limit(1);

      if (instalacaoError) {
        console.error('Erro ao atualizar tamanho da instalação:', instalacaoError);
      }

      // 7. Buscar a instalação criada para geocodificar
      const { data: instalacao } = await supabase
        .from('instalacoes_cadastradas')
        .select('id, cidade, estado')
        .eq('nome_cliente', venda.cliente_nome)
        .eq('telefone_cliente', venda.cliente_telefone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 8. Chamar geocodificação
      if (instalacao) {
        try {
          await supabase.functions.invoke('geocode-instalacao', {
            body: {
              id: instalacao.id,
              cidade: instalacao.cidade,
              estado: instalacao.estado
            }
          });
        } catch (geoError) {
          console.error('Erro na geocodificação:', geoError);
          // Não bloquear a criação da venda por erro de geocodificação
        }
      }

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
