import type { PedidoLinha } from "./usePedidoLinhas";

interface StatusPorta {
  portaId: string;
  portaDescricao: string;
  separacao: boolean;
  solda: boolean;
  perfiladeira: boolean;
  completa: boolean;
}

export function useValidacaoLinhasPorPorta(
  portas: any[],
  linhas: PedidoLinha[]
) {
  const statusPorPorta: StatusPorta[] = portas.map(porta => {
    const separacao = linhas.some(
      l => l.produto_venda_id === porta.id && l.categoria_linha === 'separacao'
    );
    const solda = linhas.some(
      l => l.produto_venda_id === porta.id && l.categoria_linha === 'solda'
    );
    const perfiladeira = linhas.some(
      l => l.produto_venda_id === porta.id && l.categoria_linha === 'perfiladeira'
    );
    
    return {
      portaId: porta.id,
      portaDescricao: `${porta.largura}m × ${porta.altura}m`,
      separacao,
      solda,
      perfiladeira,
      completa: separacao && solda && perfiladeira,
    };
  });
  
  const todasCompletas = statusPorPorta.every(s => s.completa);
  const portasCompletas = statusPorPorta.filter(s => s.completa).length;
  
  return {
    statusPorPorta,
    todasCompletas,
    portasCompletas,
    totalPortas: portas.length,
    podeSalvar: todasCompletas,
  };
}
