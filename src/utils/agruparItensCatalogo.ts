/**
 * Agrupa itens de catálogo (acessório / adicional) que aparecem em múltiplas linhas
 * em uma única linha agregada, somando quantidade, valor_total, desconto_valor,
 * custo e lucro. Itens não-catálogo (portas, instalação, pintura, manutenção)
 * são mantidos individualmente.
 */

const TIPOS_CATALOGO = new Set(['acessorio', 'adicional']);

export function isCatalogoTipo(tipo?: string | null): boolean {
  return !!tipo && TIPOS_CATALOGO.has(tipo);
}

/**
 * Cria a chave de agrupamento para um item de catálogo.
 * Considera tipo + descrição (se houver) + valor unitário + cor, para que
 * itens diferentes (ex: dois acessórios distintos) não sejam fundidos.
 */
function chaveCatalogo(p: any): string {
  const desc = (p.descricao ?? '').toString().trim().toLowerCase();
  const valorUnit =
    p.valor_produto ??
    p.valor_unitario ??
    (p.quantidade ? Number(p.valor_total ?? 0) / Number(p.quantidade || 1) : 0);
  const corId = p.catalogo_cores?.nome ?? '';
  return `${p.tipo_produto}|${desc}|${Number(valorUnit).toFixed(2)}|${corId}`;
}

/**
 * Agrupa um array de itens. Itens não-catálogo são mantidos como estão
 * (preservando sua ordem relativa). Itens de catálogo são agrupados pelo
 * helper `chaveCatalogo`.
 */
export function agruparItensCatalogo<T extends Record<string, any>>(itens: T[] | undefined | null): T[] {
  if (!itens || itens.length === 0) return [];

  const resultado: T[] = [];
  const grupos = new Map<string, T>();

  for (const item of itens) {
    if (!isCatalogoTipo(item.tipo_produto)) {
      resultado.push(item);
      continue;
    }
    const key = chaveCatalogo(item);
    const existente = grupos.get(key);
    if (!existente) {
      // clona para evitar mutar dados originais
      const clone = { ...item } as T;
      grupos.set(key, clone);
      resultado.push(clone);
    } else {
      const e: any = existente;
      e.quantidade = (Number(e.quantidade) || 0) + (Number(item.quantidade) || 0);
      e.valor_total = (Number(e.valor_total) || 0) + (Number(item.valor_total) || 0);
      if (item.desconto_valor !== undefined) {
        e.desconto_valor = (Number(e.desconto_valor) || 0) + (Number(item.desconto_valor) || 0);
      }
      if (item.custo_producao !== undefined) {
        e.custo_producao = (Number(e.custo_producao) || 0) + (Number(item.custo_producao) || 0);
      }
      if (item.custo_produto !== undefined) {
        e.custo_produto = (Number(e.custo_produto) || 0) + (Number(item.custo_produto) || 0);
      }
      if (item.lucro_item !== undefined) {
        e.lucro_item = (Number(e.lucro_item) || 0) + (Number(item.lucro_item) || 0);
      }
      // Status faturamento: agrupado fica "Faturado" só se TODOS os itens originais foram faturados.
      if (item.faturamento === false) {
        e.faturamento = false;
      }
      // Desconto percentual perde sentido ao agrupar — manter o existente apenas
      // se for igual; caso contrário zerar e confiar em desconto_valor.
      if (
        item.desconto_percentual !== undefined &&
        e.desconto_percentual !== undefined &&
        Number(item.desconto_percentual) !== Number(e.desconto_percentual)
      ) {
        e.desconto_percentual = 0;
      }
    }
  }

  return resultado;
}