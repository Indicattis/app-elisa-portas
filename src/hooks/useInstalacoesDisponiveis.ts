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
      const { data, error } = await supabase
        .from('instalacoes_cadastradas')
        .select(`
          id,
          nome_cliente,
          telefone_cliente,
          cidade,
          estado,
          data_instalacao,
          pedido_id,
          venda_id,
          pedido:pedidos_producao!instalacoes_cadastradas_pedido_id_fkey(
            id,
            numero_pedido,
            etapa_atual
          )
        `)
        .not('pedido_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar no cliente para instalações cujo pedido está em aguardando_coleta ou finalizado
      const instalacoesFiltradas = (data || []).filter(
        (inst: any) => 
          inst.pedido && 
          (inst.pedido.etapa_atual === 'aguardando_coleta' || 
           inst.pedido.etapa_atual === 'finalizado')
      );

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
