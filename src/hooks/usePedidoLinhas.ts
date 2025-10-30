import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type CategoriaLinha = 'separacao' | 'solda' | 'perfiladeira';

export interface PedidoLinha {
  id: string;
  pedido_id: string;
  estoque_id: string | null;
  nome_produto: string;
  descricao_produto: string | null;
  quantidade: number;
  ordem: number;
  tamanho: string | null;
  largura: number | null;
  altura: number | null;
  categoria_linha: CategoriaLinha;
  check_separacao: boolean;
  check_qualidade: boolean;
  check_coleta: boolean;
  created_at: string;
  updated_at: string;
}

export interface PedidoLinhaNova {
  nome_produto: string;
  descricao_produto?: string;
  quantidade: number;
  tamanho?: string;
  largura?: number;
  altura?: number;
  estoque_id?: string;
  categoria_linha: CategoriaLinha;
}

export interface PedidoLinhaUpdate {
  id: string;
  estoque_id?: string;
  nome_produto?: string;
  descricao_produto?: string;
  quantidade?: number;
  largura?: number;
  altura?: number;
  tamanho?: string;
}

export function usePedidoLinhas(pedidoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar linhas do pedido
  const { data: linhas = [], isLoading } = useQuery({
    queryKey: ['pedido-linhas', pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedido_linhas')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return (data || []) as PedidoLinha[];
    },
    enabled: !!pedidoId
  });

  // Mutation para popular automaticamente separação com acessórios e adicionais
  const popularLinhasSeparacao = useMutation({
    mutationFn: async (vendaId: string) => {
      // Verificar se já existem linhas de separação
      const existingCount = linhas.filter(l => l.categoria_linha === 'separacao').length;
      if (existingCount > 0) return;

      // Buscar acessórios e adicionais da venda
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_vendas')
        .select('*')
        .eq('venda_id', vendaId)
        .in('tipo_produto', ['acessorio', 'adicional']);

      if (produtosError) throw produtosError;
      if (!produtos || produtos.length === 0) return;

      // Calcular próxima ordem
      const proximaOrdem = linhas.length > 0 
        ? Math.max(...linhas.map(l => l.ordem)) + 1 
        : 1;

      // Inserir todas as linhas
      const linhasParaInserir = produtos.map((p, idx) => ({
        pedido_id: pedidoId,
        nome_produto: p.descricao,
        descricao_produto: p.descricao,
        quantidade: p.quantidade,
        categoria_linha: 'separacao' as CategoriaLinha,
        ordem: proximaOrdem + idx,
        check_separacao: false,
        check_qualidade: false,
        check_coleta: false,
      }));

      const { error: insertError } = await supabase
        .from('pedido_linhas')
        .insert(linhasParaInserir);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      toast({
        title: "Linhas de separação populadas",
        description: "Acessórios e adicionais foram adicionados automaticamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao popular linhas",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para adicionar linha
  const adicionarLinha = useMutation({
    mutationFn: async (linha: PedidoLinhaNova) => {
      // Calcular próxima ordem
      const proximaOrdem = linhas.length > 0 
        ? Math.max(...linhas.map(l => l.ordem)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('pedido_linhas')
        .insert({
          pedido_id: pedidoId,
          nome_produto: linha.nome_produto,
          descricao_produto: linha.descricao_produto,
          quantidade: linha.quantidade,
          tamanho: linha.tamanho,
          estoque_id: linha.estoque_id,
          categoria_linha: linha.categoria_linha,
          ordem: proximaOrdem,
          check_separacao: false,
          check_qualidade: false,
          check_coleta: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado ao pedido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para remover linha
  const removerLinha = useMutation({
    mutationFn: async (linhaId: string) => {
      const { error } = await supabase
        .from('pedido_linhas')
        .delete()
        .eq('id', linhaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-contadores'] });
      toast({
        title: "Produto removido",
        description: "O produto foi removido do pedido.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para atualizar checkbox
  const atualizarCheckbox = useMutation({
    mutationFn: async ({ linhaId, campo, valor }: { linhaId: string; campo: string; valor: boolean }) => {
      const { error } = await supabase
        .from('pedido_linhas')
        .update({ [campo]: valor })
        .eq('id', linhaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar checkbox",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const atualizarLinha = useMutation({
    mutationFn: async (update: PedidoLinhaUpdate) => {
      const { id, ...campos } = update;
      const { error } = await supabase
        .from('pedido_linhas')
        .update(campos)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar linha",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const atualizarLinhasEmLote = useMutation({
    mutationFn: async (updates: PedidoLinhaUpdate[]) => {
      const promises = updates.map(async (update) => {
        const { id, ...campos } = update;
        return supabase
          .from('pedido_linhas')
          .update(campos)
          .eq('id', id);
      });

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(`${errors.length} atualizações falharam`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      toast({
        title: "Linhas atualizadas",
        description: "Todas as alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar alterações",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para popular automaticamente perfiladeira com tiras
  const popularLinhasPerfiladeira = useMutation({
    mutationFn: async (vendaId: string) => {
      // Verificar se já existem linhas de perfiladeira do tipo tiras
      const existingTiras = linhas.filter(l => 
        l.categoria_linha === 'perfiladeira' && 
        (l.estoque_id === 'd9d2982d-1323-4f04-9783-7bd3e7eca88c' || 
         l.estoque_id === 'cf683858-1a61-46af-8566-28174a8b3683')
      );
      
      if (existingTiras.length > 0) {
        console.log('Tiras de perfiladeira já existem, pulando...');
        return;
      }

      // Buscar portas de enrolar da venda
      const { data: portas, error: portasError } = await supabase
        .from('produtos_vendas')
        .select('*')
        .eq('venda_id', vendaId)
        .eq('tipo_produto', 'porta_enrolar');

      if (portasError) throw portasError;
      if (!portas || portas.length === 0) {
        console.log('Nenhuma porta de enrolar encontrada');
        return;
      }

      // Buscar informações dos produtos de tiras
      const { data: produtosTiras, error: tirasError } = await supabase
        .from('estoque')
        .select('*')
        .in('id', [
          'd9d2982d-1323-4f04-9783-7bd3e7eca88c', // Meia cana lisa
          'cf683858-1a61-46af-8566-28174a8b3683'  // Meia cana micro
        ]);

      if (tirasError) throw tirasError;

      const meiaCanalisaInfo = produtosTiras?.find(p => p.id === 'd9d2982d-1323-4f04-9783-7bd3e7eca88c');
      const meiaCanaicroInfo = produtosTiras?.find(p => p.id === 'cf683858-1a61-46af-8566-28174a8b3683');

      if (!meiaCanalisaInfo || !meiaCanaicroInfo) {
        throw new Error('Produtos de tiras não encontrados no estoque');
      }

      // Calcular próxima ordem
      const proximaOrdem = linhas.length > 0 
        ? Math.max(...linhas.map(l => l.ordem)) + 1 
        : 1;

      // Gerar linhas para cada porta
      const linhasParaInserir: any[] = [];
      let ordemAtual = proximaOrdem;

      portas.forEach((porta) => {
        // Validar que a porta tem largura e altura
        if (!porta.largura || !porta.altura) {
          console.warn(`Porta ${porta.id} sem dimensões, pulando...`);
          return;
        }

        const larguraPorta = porta.largura;
        const alturaPorta = porta.altura;
        
        // Calcular quantidade de meia canas (altura / 0.076, arredondado para cima)
        const qtdMeiaCanas = Math.ceil(alturaPorta / 0.076);

        // Linha 1: Meia cana lisa - largura (porta - 0.14) - qtd meia canas
        linhasParaInserir.push({
          pedido_id: pedidoId,
          estoque_id: meiaCanalisaInfo.id,
          nome_produto: meiaCanalisaInfo.nome_produto,
          descricao_produto: meiaCanalisaInfo.descricao_produto,
          largura: parseFloat((larguraPorta - 0.14).toFixed(2)),
          altura: null,
          quantidade: qtdMeiaCanas,
          categoria_linha: 'perfiladeira' as CategoriaLinha,
          ordem: ordemAtual++,
          check_separacao: false,
          check_qualidade: false,
          check_coleta: false,
        });

        // Linha 2: Meia cana lisa - largura (porta + 0.1) - qtd 6
        linhasParaInserir.push({
          pedido_id: pedidoId,
          estoque_id: meiaCanalisaInfo.id,
          nome_produto: meiaCanalisaInfo.nome_produto,
          descricao_produto: meiaCanalisaInfo.descricao_produto,
          largura: parseFloat((larguraPorta + 0.1).toFixed(2)),
          altura: null,
          quantidade: 6,
          categoria_linha: 'perfiladeira' as CategoriaLinha,
          ordem: ordemAtual++,
          check_separacao: false,
          check_qualidade: false,
          check_coleta: false,
        });

        // Linha 3: Meia cana micro - largura (porta - 0.14) - qtd 4
        linhasParaInserir.push({
          pedido_id: pedidoId,
          estoque_id: meiaCanaicroInfo.id,
          nome_produto: meiaCanaicroInfo.nome_produto,
          descricao_produto: meiaCanaicroInfo.descricao_produto,
          largura: parseFloat((larguraPorta - 0.14).toFixed(2)),
          altura: null,
          quantidade: 4,
          categoria_linha: 'perfiladeira' as CategoriaLinha,
          ordem: ordemAtual++,
          check_separacao: false,
          check_qualidade: false,
          check_coleta: false,
        });
      });

      if (linhasParaInserir.length === 0) {
        console.log('Nenhuma linha para inserir');
        return;
      }

      // Inserir todas as linhas
      const { error: insertError } = await supabase
        .from('pedido_linhas')
        .insert(linhasParaInserir);

      if (insertError) throw insertError;

      return { linhasInseridas: linhasParaInserir.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pedido-linhas', pedidoId] });
      if (result?.linhasInseridas) {
        toast({
          title: "Tiras de perfiladeira adicionadas",
          description: `${result.linhasInseridas} linhas foram adicionadas automaticamente.`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Erro ao popular linhas de perfiladeira:', error);
      toast({
        title: "Erro ao adicionar tiras",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    linhas,
    isLoading,
    adicionarLinha: adicionarLinha.mutateAsync,
    removerLinha: removerLinha.mutateAsync,
    atualizarCheckbox: atualizarCheckbox.mutateAsync,
    atualizarLinha: atualizarLinha.mutateAsync,
    atualizarLinhasEmLote: atualizarLinhasEmLote.mutateAsync,
    popularLinhasSeparacao: popularLinhasSeparacao.mutateAsync,
    popularLinhasPerfiladeira: popularLinhasPerfiladeira.mutateAsync,
  };
}
