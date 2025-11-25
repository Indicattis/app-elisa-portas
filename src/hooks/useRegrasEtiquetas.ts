import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RegraEtiqueta {
  id: string;
  estoque_id: string | null;
  nome_regra: string;
  divisor: number;
  campo_condicao: string | null;
  condicao_tipo: string | null;
  condicao_valor: number | null;
  ativo: boolean;
  prioridade: number;
  created_at: string;
  updated_at: string;
  // Dados do produto (join)
  estoque?: {
    id: string;
    nome_produto: string;
    sku: string | null;
  };
}

export interface RegraEtiquetaInput {
  estoque_id: string | null;
  nome_regra: string;
  divisor: number;
  campo_condicao?: string | null;
  condicao_tipo?: string | null;
  condicao_valor?: number | null;
  ativo?: boolean;
  prioridade?: number;
}

export const useRegrasEtiquetas = () => {
  const queryClient = useQueryClient();

  // Buscar todas as regras
  const { data: regras = [], isLoading } = useQuery({
    queryKey: ['regras-etiquetas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_etiquetas')
        .select(`
          *,
          estoque:estoque_id (
            id,
            nome_produto,
            sku
          )
        `)
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RegraEtiqueta[];
    },
  });

  // Criar regra
  const criarRegra = useMutation({
    mutationFn: async (input: RegraEtiquetaInput) => {
      const { data, error } = await supabase
        .from('regras_etiquetas')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-etiquetas'] });
      toast.success('Regra criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar regra: ' + error.message);
    },
  });

  // Atualizar regra
  const atualizarRegra = useMutation({
    mutationFn: async ({ id, ...input }: RegraEtiquetaInput & { id: string }) => {
      const { data, error } = await supabase
        .from('regras_etiquetas')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-etiquetas'] });
      toast.success('Regra atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar regra: ' + error.message);
    },
  });

  // Excluir regra
  const excluirRegra = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('regras_etiquetas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-etiquetas'] });
      toast.success('Regra excluída com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir regra: ' + error.message);
    },
  });

  // Função para encontrar regra aplicável a um item
  const encontrarRegraAplicavel = (
    estoqueId: string | null,
    dimensoes?: { tamanho?: number }
  ): RegraEtiqueta | null => {
    if (!estoqueId) return null;

    // Filtrar regras ativas do produto
    const regrasAtivas = regras
      .filter(r => r.ativo && r.estoque_id === estoqueId)
      .sort((a, b) => b.prioridade - a.prioridade);

    for (const regra of regrasAtivas) {
      // Se não há condição de dimensão, usar esta regra
      if (!regra.campo_condicao || !regra.condicao_tipo || regra.condicao_valor === null) {
        return regra;
      }

      // Verificar condição de dimensão
      const valorCampo = dimensoes?.[regra.campo_condicao as keyof typeof dimensoes];
      if (valorCampo === undefined) continue;

      const condicaoAtendida = verificarCondicao(
        valorCampo,
        regra.condicao_tipo,
        regra.condicao_valor
      );

      if (condicaoAtendida) {
        return regra;
      }
    }

    return null;
  };

  // Função para encontrar regra aplicável pelo nome do produto (fallback)
  const encontrarRegraPorNome = (
    nomeProduto: string,
    dimensoes?: { tamanho?: number }
  ): RegraEtiqueta | null => {
    if (!nomeProduto) return null;

    const nomeNormalizado = nomeProduto.toLowerCase().trim();

    // Filtrar regras ativas onde o nome do produto do estoque corresponde
    const regrasAtivas = regras
      .filter(r => r.ativo && r.estoque?.nome_produto?.toLowerCase().trim() === nomeNormalizado)
      .sort((a, b) => b.prioridade - a.prioridade);

    for (const regra of regrasAtivas) {
      // Se não há condição de dimensão, usar esta regra
      if (!regra.campo_condicao || !regra.condicao_tipo || regra.condicao_valor === null) {
        return regra;
      }

      // Verificar condição de dimensão
      const valorCampo = dimensoes?.[regra.campo_condicao as keyof typeof dimensoes];
      if (valorCampo === undefined) continue;

      const condicaoAtendida = verificarCondicao(
        valorCampo,
        regra.condicao_tipo,
        regra.condicao_valor
      );

      if (condicaoAtendida) {
        return regra;
      }
    }

    return null;
  };

  // Função para calcular etiquetas com base nas regras
  const calcularEtiquetasComRegra = (
    estoqueId: string | null,
    quantidade: number,
    dimensoes?: { tamanho?: number }
  ): { etiquetas: number; regra: RegraEtiqueta | null } => {
    const regra = encontrarRegraAplicavel(estoqueId, dimensoes);

    if (regra) {
      return {
        etiquetas: Math.ceil(quantidade / regra.divisor),
        regra,
      };
    }

    // Sem regra = 1 etiqueta por unidade
    return {
      etiquetas: quantidade,
      regra: null,
    };
  };

  return {
    regras,
    isLoading,
    criarRegra,
    atualizarRegra,
    excluirRegra,
    encontrarRegraAplicavel,
    encontrarRegraPorNome,
    calcularEtiquetasComRegra,
  };
};

// Helper para verificar condições
function verificarCondicao(valor: number, tipo: string, valorComparacao: number): boolean {
  switch (tipo) {
    case 'maior':
      return valor > valorComparacao;
    case 'menor':
      return valor < valorComparacao;
    case 'igual':
      return valor === valorComparacao;
    case 'maior_igual':
      return valor >= valorComparacao;
    case 'menor_igual':
      return valor <= valorComparacao;
    default:
      return false;
  }
}
