import type { PedidoLinha } from "./usePedidoLinhas";

interface PortaBase {
  id: string;
  largura?: number;
  altura?: number;
  quantidade?: number;
  [key: string]: any;
}

interface PortaExpandida extends PortaBase {
  _originalId: string;
  _indicePorta: number;
  _virtualKey: string;
}

interface StatusPorta {
  portaKey: string;
  portaDescricao: string;
  separacao: boolean;
  solda: boolean;
  perfiladeira: boolean;
  completa: boolean;
}

// Verifica se uma porta já está expandida
function isPortaExpandida(porta: PortaBase | PortaExpandida): porta is PortaExpandida {
  return '_originalId' in porta && '_indicePorta' in porta && '_virtualKey' in porta;
}

export function useValidacaoLinhasPorPorta(
  portas: (PortaBase | PortaExpandida)[],
  linhas: PedidoLinha[]
) {
  const statusPorPorta: StatusPorta[] = portas.map(porta => {
    // Se a porta já está expandida, usar os campos virtuais
    // Caso contrário, usar id diretamente e indice 0
    const originalId = isPortaExpandida(porta) ? porta._originalId : porta.id;
    const indicePorta = isPortaExpandida(porta) ? porta._indicePorta : 0;
    const virtualKey = isPortaExpandida(porta) ? porta._virtualKey : porta.id;

    const separacao = linhas.some(
      l => l.produto_venda_id === originalId && 
           (l.indice_porta ?? 0) === indicePorta &&
           l.categoria_linha === 'separacao'
    );
    const solda = linhas.some(
      l => l.produto_venda_id === originalId && 
           (l.indice_porta ?? 0) === indicePorta &&
           l.categoria_linha === 'solda'
    );
    const perfiladeira = linhas.some(
      l => l.produto_venda_id === originalId && 
           (l.indice_porta ?? 0) === indicePorta &&
           l.categoria_linha === 'perfiladeira'
    );
    
    return {
      portaKey: virtualKey,
      portaDescricao: `${porta.largura}m × ${porta.altura}m`,
      separacao,
      solda,
      perfiladeira,
      completa: separacao && solda && perfiladeira,
    };
  });
  
  const todasCompletas = statusPorPorta.every(s => s.completa);
  const portasCompletas = statusPorPorta.filter(s => s.completa).length;
  const temPeloMenosUmaLinha = linhas.length > 0;
  
  return {
    statusPorPorta,
    todasCompletas,
    portasCompletas,
    totalPortas: portas.length,
    podeSalvar: temPeloMenosUmaLinha,
  };
}
