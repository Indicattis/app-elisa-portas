import { EtiquetaCalculo } from '@/types/etiqueta';

interface LinhaOrdem {
  id: string;
  item: string;
  quantidade: number;
  tamanho?: string;
  largura?: number;
  altura?: number;
}

export const useEtiquetasProducao = () => {
  // Função de cálculo de etiquetas adaptada para LinhaOrdem
  const calcularEtiquetasLinha = (linha: LinhaOrdem): EtiquetaCalculo => {
    const nomeProduto = linha.item || 'Item';
    const isMeiaCana = nomeProduto.toLowerCase().includes('meia cana');
    
    if (!isMeiaCana) {
      return {
        linhaId: linha.id,
        nomeProduto,
        quantidade: linha.quantidade,
        etiquetasNecessarias: linha.quantidade,
        tipoCalculo: 'normal',
        explicacao: `Cada unidade recebe 1 etiqueta. Total: ${linha.quantidade} etiqueta(s).`,
        largura: linha.largura || undefined,
        altura: linha.altura || undefined,
      };
    }

    // Para meia canas, verificar dimensões
    const largura = linha.largura || 0;
    const altura = linha.altura || 0;
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
