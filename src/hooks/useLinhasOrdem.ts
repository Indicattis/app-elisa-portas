import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho: string | null;
  largura: number | null;
  altura: number | null;
  concluida: boolean;
  com_problema?: boolean;
  produto_venda_id?: string | null;
  indice_porta?: number | null;
  estoque?: {
    nome_produto: string;
    unidade: string | null;
  } | null;
}

export function useLinhasOrdem(ordemId: string | null, tipoOrdem: string | null) {
  return useQuery({
    queryKey: ["linhas-ordem", ordemId, tipoOrdem],
    queryFn: async () => {
      if (!ordemId || !tipoOrdem) return [];
      
      const { data, error } = await supabase
        .from("linhas_ordens")
        .select(`
          id,
          item,
          quantidade,
          tamanho,
          largura,
          altura,
          concluida,
          com_problema,
          produto_venda_id,
          indice_porta,
          estoque:estoque_id (nome_produto, unidade)
        `)
        .eq("ordem_id", ordemId)
        .eq("tipo_ordem", tipoOrdem)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar linhas da ordem:", error);
        return [];
      }

      return (data || []) as LinhaOrdem[];
    },
    enabled: !!ordemId && !!tipoOrdem,
  });
}
