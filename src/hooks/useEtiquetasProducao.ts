import { EtiquetaCalculo } from '@/types/etiqueta';
import { useRegrasEtiquetas } from './useRegrasEtiquetas';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  largura?: number;
  altura?: number;
  estoque_id?: string;
}

export const useEtiquetasProducao = () => {
  const { regras, calcularEtiquetasComRegra, encontrarRegraPorNome } = useRegrasEtiquetas();

  // Função de cálculo de etiquetas adaptada para LinhaOrdem
  const calcularEtiquetasLinha = (linha: LinhaOrdem): EtiquetaCalculo => {
    const nomeProduto = linha.item || 'Item';
    const largura = linha.largura || 0;
    const altura = linha.altura || 0;

    // Tentar encontrar regra dinâmica primeiro (por estoque_id)
    if (linha.estoque_id && regras.length > 0) {
      const { etiquetas, regra } = calcularEtiquetasComRegra(
        linha.estoque_id,
        linha.quantidade,
        { tamanho: largura }
      );

      if (regra) {
        return {
          linhaId: linha.id,
          nomeProduto,
          quantidade: linha.quantidade,
          etiquetasNecessarias: etiquetas,
          tipoCalculo: regra.campo_condicao ? 'regra_condicional' : 'regra_simples',
          explicacao: `Regra "${regra.nome_regra}": ${linha.quantidade} ÷ ${regra.divisor} = ${etiquetas} etiqueta(s).`,
          largura: largura || undefined,
          altura: altura || undefined,
        };
      }
    }

    // Tentar encontrar regra pelo nome do produto (fallback)
    if (regras.length > 0) {
      const regraPorNome = encontrarRegraPorNome(nomeProduto, { tamanho: largura });
      if (regraPorNome) {
        const etiquetas = Math.ceil(linha.quantidade / regraPorNome.divisor);
        return {
          linhaId: linha.id,
          nomeProduto,
          quantidade: linha.quantidade,
          etiquetasNecessarias: etiquetas,
          tipoCalculo: regraPorNome.campo_condicao ? 'regra_condicional' : 'regra_simples',
          explicacao: `Regra "${regraPorNome.nome_regra}": ${linha.quantidade} ÷ ${regraPorNome.divisor} = ${etiquetas} etiqueta(s).`,
          largura: largura || undefined,
          altura: altura || undefined,
        };
      }
    }

    // Fallback: Lógica legada para meia canas
    const isMeiaCana = nomeProduto.toLowerCase().includes('meia cana');
    
    if (!isMeiaCana) {
      return {
        linhaId: linha.id,
        nomeProduto,
        quantidade: linha.quantidade,
        etiquetasNecessarias: linha.quantidade,
        tipoCalculo: 'normal',
        explicacao: `Cada unidade recebe 1 etiqueta. Total: ${linha.quantidade} etiqueta(s).`,
        largura: largura || undefined,
        altura: altura || undefined,
      };
    }

    // Para meia canas, verificar dimensões (regra legada)
    const temDimensaoGrande = largura > 6.5 || altura > 6.5;
    
    if (temDimensaoGrande) {
      const etiquetas = Math.ceil(linha.quantidade / 5);
      return {
        linhaId: linha.id,
        nomeProduto,
        quantidade: linha.quantidade,
        etiquetasNecessarias: etiquetas,
        tipoCalculo: 'meia_cana_grande',
        explicacao: `Porta grande (largura ${largura}m ou altura ${altura}m > 6.5m). Quantidade de meia canas (${linha.quantidade}) ÷ 5 = ${etiquetas} etiqueta(s).`,
        largura,
        altura,
      };
    } else {
      const etiquetas = Math.ceil(linha.quantidade / 10);
      return {
        linhaId: linha.id,
        nomeProduto,
        quantidade: linha.quantidade,
        etiquetasNecessarias: etiquetas,
        tipoCalculo: 'meia_cana_pequena',
        explicacao: `Porta pequena (largura ${largura}m e altura ${altura}m ≤ 6.5m). Quantidade de meia canas (${linha.quantidade}) ÷ 10 = ${etiquetas} etiqueta(s).`,
        largura,
        altura,
      };
    }
  };

  return {
    calcularEtiquetasLinha,
  };
};
