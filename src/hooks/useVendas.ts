import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import { PagamentoData } from '@/components/vendas/PagamentoSection';

export interface ProdutoVenda {
  id?: string;
  tipo_produto: 'porta_enrolar' | 'porta_social' | 'pintura_epoxi' | 'acessorio' | 'adicional' | 'porta' | 'manutencao';
  tamanho?: string;
  largura?: number;
  altura?: number;
  cor_id?: string;
  acessorio_id?: string;
  adicional_id?: string;
  estoque_id?: string;
  tipo_pintura?: string;
  tipo_servico?: string;
  valor_produto: number;
  valor_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  tipo_desconto: 'percentual' | 'valor';
  desconto_percentual: number;
  desconto_valor: number;
  quantidade: number;
  descricao?: string;
  valor_credito?: number;
  percentual_credito?: number;
}

// Manter compatibilidade com código existente
export type PortaVenda = ProdutoVenda;

export interface VendaFormData {
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string;
  cpf_cliente?: string;
  estado: string;
  cidade: string;
  cep?: string;
  bairro?: string;
  endereco?: string;
  publico_alvo: string;
  forma_pagamento: string;
  observacoes_venda?: string;
  data_venda?: string;
  valor_frete?: number;
  valor_entrada?: number;
  valor_a_receber?: number;
  canal_aquisicao_id?: string;
  data_prevista_entrega?: string;
  tipo_entrega?: string;
  venda_presencial?: boolean;
  cliente_id?: string; // ID do cliente existente selecionado
  orcamento_id?: string; // ID do orçamento se for conversão
}

export interface AutorizacaoDesconto {
  autorizado_por: string;
  solicitado_por: string;
  percentual_desconto: number;
  senha_usada: string;
  tipo_autorizacao: 'responsavel_setor' | 'master';
  observacoes?: string;
}

export interface CreditoVenda {
  valorCredito: number;
  percentualCredito: number;
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
          produtos:produtos_vendas(
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
    mutationFn: async ({ 
      vendaData, 
      portas, 
      pagamentoData,
      autorizacaoDesconto,
      creditoVenda
    }: { 
      vendaData: VendaFormData; 
      portas: ProdutoVenda[];
      pagamentoData?: PagamentoData;
      autorizacaoDesconto?: AutorizacaoDesconto;
      creditoVenda?: CreditoVenda;
    }) => {
      if (portas.length === 0) {
        throw new Error('É necessário adicionar pelo menos um produto');
      }

      // Validar localização obrigatória para emissão de NF-e
      if (!vendaData.estado || !vendaData.cidade || !vendaData.cep || !vendaData.bairro || !vendaData.endereco) {
        throw new Error('Todos os campos de localização são obrigatórios (Estado, Cidade, CEP, Bairro e Endereço)');
      }

      // Validar tamanho mínimo de endereço e bairro (requisito SEFAZ)
      if (vendaData.endereco && vendaData.endereco.length < 2) {
        throw new Error('O endereço deve ter no mínimo 2 caracteres');
      }

      if (vendaData.bairro && vendaData.bairro.length < 2) {
        throw new Error('O bairro deve ter no mínimo 2 caracteres');
      }

      // 1. Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('🔍 User ID from auth:', user.id);

      // 2. Buscar admin_user correspondente
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id, nome, email')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('✅ Admin user found:', adminUser, 'Error:', adminError);
      
      if (adminError) {
        throw new Error(`Erro ao buscar usuário: ${adminError.message}`);
      }
      
      if (!adminUser) {
        throw new Error('Usuário não encontrado no sistema. Por favor, entre em contato com o administrador.');
      }

      // 3. Calcular totais dos produtos (sem crédito por produto - agora é a nível de venda)
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

      // Crédito a nível de venda
      const valorCreditoVenda = creditoVenda?.valorCredito || 0;
      const percentualCreditoVenda = creditoVenda?.percentualCredito || 0;

      const valor_frete = vendaData.valor_frete || 0;
      const valor_total_venda = totais.valor_total + valorCreditoVenda + valor_frete;
      const valor_entrada = vendaData.valor_entrada || 0;
      const valor_a_receber = valor_total_venda - valor_entrada;

      // 4. Criar ou vincular cliente
      let clienteId: string | null = null;

      if (vendaData.cliente_id) {
        // Cliente existente selecionado
        clienteId = vendaData.cliente_id;
      } else if (vendaData.cpf_cliente) {
        // Verificar se cliente já existe por CPF/CNPJ
        const cpfNormalizado = vendaData.cpf_cliente.replace(/\D/g, '');
        if (cpfNormalizado.length >= 11) {
          const { data: clienteExistente } = await supabase
            .from('clientes')
            .select('id')
            .eq('ativo', true)
            .ilike('cpf_cnpj', `%${cpfNormalizado}%`)
            .maybeSingle();
          
          if (clienteExistente) {
            clienteId = clienteExistente.id;
          } else {
            // Criar novo cliente
            const { data: novoCliente, error: clienteError } = await supabase
              .from('clientes')
              .insert({
                nome: vendaData.cliente_nome,
                telefone: vendaData.cliente_telefone || null,
                email: vendaData.cliente_email || null,
                cpf_cnpj: vendaData.cpf_cliente,
                estado: vendaData.estado || null,
                cidade: vendaData.cidade || null,
                cep: vendaData.cep || null,
                endereco: vendaData.endereco || null,
                bairro: vendaData.bairro || null,
                canal_aquisicao_id: vendaData.canal_aquisicao_id || null,
                created_by: user.id
              })
              .select()
              .single();
            
            if (!clienteError && novoCliente) {
              clienteId = novoCliente.id;
              console.log('✅ Novo cliente criado:', novoCliente.id);
            } else if (clienteError) {
              console.error('Erro ao criar cliente:', clienteError);
            }
          }
        }
      } else if (vendaData.cliente_nome) {
        // Cliente sem CPF - criar mesmo assim
        const { data: novoCliente, error: clienteError } = await supabase
          .from('clientes')
          .insert({
            nome: vendaData.cliente_nome,
            telefone: vendaData.cliente_telefone || null,
            email: vendaData.cliente_email || null,
            estado: vendaData.estado || null,
            cidade: vendaData.cidade || null,
            cep: vendaData.cep || null,
            endereco: vendaData.endereco || null,
            bairro: vendaData.bairro || null,
            canal_aquisicao_id: vendaData.canal_aquisicao_id || null,
            created_by: user.id
          })
          .select()
          .single();
        
        if (!clienteError && novoCliente) {
          clienteId = novoCliente.id;
          console.log('✅ Novo cliente (sem CPF) criado:', novoCliente.id);
        } else if (clienteError) {
          console.error('Erro ao criar cliente:', clienteError);
        }
      }

      // 5. Criar venda com valores calculados
      const { endereco, venda_presencial, cliente_id: _, ...vendaDataLimpo } = vendaData;
      
      // Definir se pagamento é na instalação (para cartão de crédito)
      const pagoNaInstalacao = pagamentoData?.metodo_pagamento === 'cartao_credito' && pagamentoData?.pago_na_instalacao;
      
      const vendaPayload = {
        ...vendaDataLimpo,
        cliente_id: clienteId, // Vincula ao cliente
        cpf_cliente: vendaData.cpf_cliente || null,
        atendente_id: adminUser.user_id,
        data_venda: vendaData.data_venda || new Date().toISOString(),
        valor_venda: valor_total_venda,
        lucro_total: 0,
        valor_frete: valor_frete,
        valor_instalacao: totais.valor_instalacao,
        valor_entrada: valor_entrada,
        valor_a_receber: valor_a_receber,
        // Crédito a nível de venda
        valor_credito: valorCreditoVenda,
        percentual_credito: percentualCreditoVenda,
        // Campos de pagamento
        metodo_pagamento: pagamentoData?.metodo_pagamento || vendaData.forma_pagamento,
        empresa_receptora_id: pagamentoData?.empresa_receptora_id || null,
        quantidade_parcelas: pagamentoData?.quantidade_parcelas || 1,
        pago_na_instalacao: pagoNaInstalacao
      };

      console.log('📦 Venda payload:', vendaPayload);

      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert([vendaPayload])
        .select()
        .single();
      
      if (vendaError) throw vendaError;

      // 6. Criar produtos da venda
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
        descricao: produto.tipo_produto === 'porta_enrolar' ? 'Porta de Enrolar' : (produto.descricao || null),
        valor_credito: produto.valor_credito || 0,
        percentual_credito: produto.percentual_credito || 0
      }));
      
      const { error: produtosError } = await supabase
        .from('produtos_vendas')
        .insert(produtosComVendaId);
      
      if (produtosError) throw produtosError;

      // 7. GERAR CONTAS A RECEBER baseado no método de pagamento
      const dataVendaBase = new Date(vendaData.data_venda || new Date().toISOString());
      
      if (pagamentoData) {
        // === BOLETO ===
        if (pagamentoData.metodo_pagamento === 'boleto') {
          const valorParcela = valor_a_receber / pagamentoData.quantidade_parcelas;
          const parcelas = [];
          
          for (let i = 1; i <= pagamentoData.quantidade_parcelas; i++) {
            const dataVencimento = addDays(dataVendaBase, pagamentoData.intervalo_boletos * i);
            parcelas.push({
              venda_id: venda.id,
              numero_parcela: i,
              valor_parcela: valorParcela,
              data_vencimento: dataVencimento.toISOString().split('T')[0],
              metodo_pagamento: 'boleto',
              empresa_receptora_id: pagamentoData.empresa_receptora_id || null,
              status: 'pendente'
            });
          }
          
          if (parcelas.length > 0) {
            const { error: parcelasError } = await supabase
              .from('contas_receber')
              .insert(parcelas);
            
            if (parcelasError) {
              console.error('Erro ao criar parcelas boleto:', parcelasError);
            }
          }
        }
        
        // === CARTÃO DE CRÉDITO (sem pagamento na instalação) ===
        if (pagamentoData.metodo_pagamento === 'cartao_credito' && !pagamentoData.pago_na_instalacao) {
          const valorParcela = valor_a_receber / pagamentoData.quantidade_parcelas;
          const parcelas = [];
          
          for (let i = 1; i <= pagamentoData.quantidade_parcelas; i++) {
            const dataVencimento = addDays(dataVendaBase, 30 * i);
            parcelas.push({
              venda_id: venda.id,
              numero_parcela: i,
              valor_parcela: valorParcela,
              data_vencimento: dataVencimento.toISOString().split('T')[0],
              metodo_pagamento: 'cartao_credito',
              empresa_receptora_id: pagamentoData.empresa_receptora_id || null,
              status: 'pendente'
            });
          }
          
          if (parcelas.length > 0) {
            const { error: parcelasError } = await supabase
              .from('contas_receber')
              .insert(parcelas);
            
            if (parcelasError) {
              console.error('Erro ao criar parcelas cartão:', parcelasError);
            }
          }
        }
        
        // === CARTÃO DE CRÉDITO (com pagamento na instalação) ===
        // As parcelas serão geradas quando a entrega for concluída
        // A flag pago_na_instalacao já foi salva na venda
        
        // === DINHEIRO COM 2 PARCELAS ===
        if (pagamentoData.metodo_pagamento === 'dinheiro' && pagamentoData.parcelas_dinheiro === 2) {
          const saldoRestante = valor_a_receber - (pagamentoData.valor_entrada_dinheiro || 0);
          
          // Data de vencimento = data prevista de entrega ou 30 dias após a venda
          const dataVencimento = vendaData.data_prevista_entrega 
            ? new Date(vendaData.data_prevista_entrega)
            : addDays(dataVendaBase, 30);
          
          const { error: parcelaDinheiroError } = await supabase
            .from('contas_receber')
            .insert({
              venda_id: venda.id,
              numero_parcela: 2,
              valor_parcela: saldoRestante,
              data_vencimento: dataVencimento.toISOString().split('T')[0],
              metodo_pagamento: 'dinheiro',
              status: 'pendente',
              pago_na_instalacao: pagamentoData.restante_na_instalacao
            });
          
          if (parcelaDinheiroError) {
            console.error('Erro ao criar parcela dinheiro:', parcelaDinheiroError);
          }
        }
        
        // === À VISTA ou DINHEIRO 1 PARCELA ===
        // Não gera contas a receber (pagamento já realizado)
        
        // === UPLOAD COMPROVANTE PARA À VISTA ===
        if (pagamentoData.metodo_pagamento === 'a_vista' && pagamentoData.comprovante_file) {
          const fileName = `${venda.id}/${Date.now()}_${pagamentoData.comprovante_file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('comprovantes-pagamento')
            .upload(fileName, pagamentoData.comprovante_file);
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('comprovantes-pagamento')
              .getPublicUrl(fileName);
            
            await supabase
              .from('vendas')
              .update({ 
                comprovante_url: urlData.publicUrl,
                comprovante_nome: pagamentoData.comprovante_file.name 
              })
              .eq('id', venda.id);
          } else {
            console.error('Erro ao fazer upload do comprovante:', uploadError);
          }
        }
      }

      // 8. Atualizar instalação criada automaticamente pelo trigger
      const tamanhosConcatenados = portas.map(p => p.tamanho).join(', ');
      
      const updateData: any = { 
        tamanho: tamanhosConcatenados,
        saldo: valor_a_receber
      };
      if (vendaData.data_prevista_entrega) {
        updateData.data_instalacao = vendaData.data_prevista_entrega;
      }
      if (vendaData.tipo_entrega) {
        updateData.categoria = vendaData.tipo_entrega.toLowerCase();
      }
      
      const { error: instalacaoError } = await supabase
        .from('instalacoes')
        .update(updateData)
        .eq('venda_id', venda.id);

      if (instalacaoError) {
        console.error('Erro ao atualizar instalação:', instalacaoError);
      }

      // 9. Salvar autorização de desconto, se houver
      if (autorizacaoDesconto) {
        const { error: autorizacaoError } = await supabase
          .from('vendas_autorizacoes_desconto')
          .insert([{
            venda_id: venda.id,
            percentual_desconto: autorizacaoDesconto.percentual_desconto,
            autorizado_por: autorizacaoDesconto.autorizado_por,
            solicitado_por: autorizacaoDesconto.solicitado_por,
            senha_usada: autorizacaoDesconto.senha_usada,
            tipo_autorizacao: autorizacaoDesconto.tipo_autorizacao,
            observacoes: autorizacaoDesconto.observacoes || null
          }]);

        if (autorizacaoError) {
          console.error('Erro ao salvar autorização:', autorizacaoError);
        }
      }

      // 10. Buscar a instalação para geocodificar
      const { data: instalacao } = await supabase
        .from('instalacoes')
        .select('id')
        .eq('venda_id', venda.id)
        .single();

      // 11. Chamar geocodificação
      if (instalacao && venda.cidade && venda.estado) {
        try {
          await supabase.functions.invoke('geocode-instalacao', {
            body: {
              id: instalacao.id,
              cidade: venda.cidade,
              estado: venda.estado
            }
          });
        } catch (geoError) {
          console.error('Erro na geocodificação:', geoError);
        }
      }

      return venda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['contador-vendas'] });
      queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: 'Sucesso',
        description: 'Venda criada com sucesso!',
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
      // Usar a função RPC que exclui em cascata
      const { error } = await supabase.rpc('delete_venda_completa', {
        p_venda_id: vendaId
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['ordens'] });
      queryClient.invalidateQueries({ queryKey: ['pontuacao'] });
      toast({
        title: 'Sucesso',
        description: 'Venda e todos os itens vinculados excluídos com sucesso',
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