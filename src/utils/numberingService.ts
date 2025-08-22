import { supabase } from "@/integrations/supabase/client";

/**
 * Gera o próximo número sequencial para pedidos ou orçamentos
 * @param tipo - 'pedido' ou 'orcamento'
 * @returns Próximo número sequencial
 */
export async function gerarProximoNumero(tipo: 'pedido' | 'orcamento'): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('gerar_proximo_numero', {
      tipo_documento: tipo
    });

    if (error) {
      console.error('Erro ao gerar próximo número:', error);
      throw error;
    }

    return data as number;
  } catch (error) {
    console.error('Erro ao gerar próximo número:', error);
    // Fallback: retorna um número baseado em timestamp caso falhe
    return Math.floor(Date.now() / 1000) % 10000;
  }
}

/**
 * Formata o número do pedido com zeros à esquerda
 * @param numero - Número do pedido
 * @returns Número formatado (ex: 0001, 0042, 1234)
 */
export function formatarNumeroPedido(numero: number): string {
  return numero.toString().padStart(4, '0');
}

/**
 * Formata o número do orçamento com zeros à esquerda
 * @param numero - Número do orçamento
 * @returns Número formatado (ex: 0001, 0042, 1234)
 */
export function formatarNumeroOrcamento(numero: number): string {
  return numero.toString().padStart(4, '0');
}