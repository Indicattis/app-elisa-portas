import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InstalacaoDisponivel {
  id: string;
  nome_cliente: string;
  telefone_cliente: string;
  cidade: string;
  estado: string;
  data_instalacao: string | null;
  pedido_id: string;
  venda_id: string;
  pedido: {
    id: string;
    numero_pedido: string;
    etapa_atual: string;
  } | null;
}

export function useInstalacoesDisponiveis() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInstalacoesDisponiveis = async (): Promise<InstalacaoDisponivel[]> => {
    setLoading(true);
    try {
      // Buscar instalações com pedidos
      const { data: instalacoes, error: instError } = await supabase
        .from('instalacoes')
        .select(`
          id,
          nome_cliente,
          telefone_cliente,
          cidade,
          estado,
          data_instalacao,
          pedido_id,
          venda_id,
          pedido:pedidos_producao(
            id,
            numero_pedido
          )
        `)
        .not('pedido_id', 'is', null)
        .order('created_at', { ascending: false });

      if (instError) throw instError;

      // Para cada instalação, buscar a última etapa do pedido
      const instalacoesFiltradas = [];
      
      for (const inst of instalacoes || []) {
        if (!inst.pedido_id) continue;

        // Buscar a última etapa do pedido
        const { data: etapas, error: etapaError } = await supabase
          .from('pedidos_etapas')
          .select('etapa')
          .eq('pedido_id', inst.pedido_id)
          .order('data_entrada', { ascending: false })
          .limit(1);

        if (etapaError) {
          console.error('Erro ao buscar etapa do pedido:', etapaError);
          continue;
        }

        const ultimaEtapa = etapas?.[0]?.etapa;

        // Filtrar apenas instalações com pedidos em "aguardando_instalacao" ou "finalizado"
        if (ultimaEtapa === 'aguardando_instalacao' || ultimaEtapa === 'finalizado') {
          instalacoesFiltradas.push({
            ...inst,
            pedido: inst.pedido ? {
              ...inst.pedido,
              etapa_atual: ultimaEtapa
            } : null
          });
        }
      }

      return instalacoesFiltradas as InstalacaoDisponivel[];
    } catch (error) {
      console.error('Erro ao buscar instalações disponíveis:', error);
      toast({
        title: "Erro ao buscar instalações",
        description: "Não foi possível carregar as instalações disponíveis",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchInstalacoesDisponiveis, loading };
}
