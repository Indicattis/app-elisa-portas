import { supabase } from "@/integrations/supabase/client";
import { ItemTabelaPreco } from "@/hooks/useTabelaPrecos";

/**
 * Busca o preço na tabela de preços baseado nas medidas informadas
 * Retorna o item com a menor largura >= largura informada e menor altura >= altura informada
 */
export async function buscarPrecosPorMedidas(
  largura: number, 
  altura: number
): Promise<ItemTabelaPreco | null> {
  try {
    // Buscar todos os itens ativos que atendem aos critérios
    const { data: itens, error } = await supabase
      .from('tabela_precos_portas')
      .select('*')
      .eq('ativo', true)
      .gte('largura', largura)
      .gte('altura', altura)
      .order('largura', { ascending: true })
      .order('altura', { ascending: true });

    if (error) {
      console.error('Erro ao buscar preços:', error);
      return null;
    }

    // Retornar o primeiro item (menor largura e altura que atende aos critérios)
    return itens && itens.length > 0 ? itens[0] : null;
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    return null;
  }
}
