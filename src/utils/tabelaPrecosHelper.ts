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
  const TOLERANCIA = 0.15;

  try {
    // Buscar todos os itens ativos ordenados por largura e altura
    const { data: itens, error } = await supabase
      .from('tabela_precos_portas')
      .select('*')
      .eq('ativo', true)
      .order('largura', { ascending: true })
      .order('altura', { ascending: true });

    if (error) {
      console.error('Erro ao buscar preços:', error);
      return null;
    }

    if (!itens || itens.length === 0) return null;

    // Encontrar o primeiro item que atende ambas as dimensões com tolerância de 15cm
    const match = itens.find((item) => {
      const larguraOk = item.largura >= largura || (largura - item.largura <= TOLERANCIA);
      const alturaOk = item.altura >= altura || (altura - item.altura <= TOLERANCIA);
      return larguraOk && alturaOk;
    });

    return match || null;
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    return null;
  }
}
