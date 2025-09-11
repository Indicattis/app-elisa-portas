import { AutorizadoPerformance } from "@/hooks/useAutorizadosPerformance";
import { FiltrosAutorizados } from "@/components/AutorizadosFiltros";

export function aplicarFiltros(
  autorizados: AutorizadoPerformance[], 
  filtros: FiltrosAutorizados
): AutorizadoPerformance[] {
  return autorizados.filter(autorizado => {
    // Filtro de busca
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const match = autorizado.nome.toLowerCase().includes(busca) ||
                   autorizado.vendedor?.nome.toLowerCase().includes(busca);
      if (!match) return false;
    }

    // Filtro de etapa
    if (filtros.etapa !== 'todos' && autorizado.etapa !== filtros.etapa) {
      return false;
    }

    // Filtro de status de risco
    if (filtros.statusRisco !== 'todos' && autorizado.status_risco !== filtros.statusRisco) {
      return false;
    }

    // Filtro de atendente
    if (filtros.atendente && autorizado.vendedor?.nome !== filtros.atendente) {
      return false;
    }

    // Filtro de faixa de avaliação
    if (filtros.faixaAvaliacao !== 'todos') {
      const rating = autorizado.average_rating;
      switch (filtros.faixaAvaliacao) {
        case '4-5':
          if (rating < 4) return false;
          break;
        case '3-4':
          if (rating < 3 || rating >= 4) return false;
          break;
        case '2-3':
          if (rating < 2 || rating >= 3) return false;
          break;
        case '0-2':
          if (rating >= 2) return false;
          break;
      }
    }

    // Filtro de tempo da última avaliação
    if (filtros.tempoUltimaAvaliacao !== 'todos') {
      const dias = autorizado.dias_sem_avaliacao;
      switch (filtros.tempoUltimaAvaliacao) {
        case '0-30':
          if (dias > 30) return false;
          break;
        case '30-60':
          if (dias <= 30 || dias > 60) return false;
          break;
        case '60-90':
          if (dias <= 60 || dias > 90) return false;
          break;
        case '90+':
          if (dias <= 90) return false;
          break;
      }
    }

    return true;
  });
}

export function formatarTempoUltimaAvaliacao(dias: number): string {
  if (dias === 999) return "Nunca avaliado";
  
  if (dias === 0) return "Hoje";
  if (dias === 1) return "1 dia";
  if (dias < 7) return `${dias} dias`;
  
  const semanas = Math.floor(dias / 7);
  const diasRestantes = dias % 7;
  
  if (dias < 30) {
    if (diasRestantes === 0) {
      return `${semanas} semana${semanas > 1 ? 's' : ''}`;
    }
    return `${semanas} semana${semanas > 1 ? 's' : ''} e ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;
  }
  
  const meses = Math.floor(dias / 30);
  const diasRestantesMes = dias % 30;
  
  if (diasRestantesMes === 0) {
    return `${meses} mês${meses > 1 ? 'es' : ''}`;
  }
  
  return `${meses} mês${meses > 1 ? 'es' : ''} e ${diasRestantesMes} dia${diasRestantesMes > 1 ? 's' : ''}`;
}

export function getStatusRiscoColor(status: 'em_dia' | 'atencao' | 'critico'): string {
  switch (status) {
    case 'em_dia':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'atencao':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'critico':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

export function getStatusRiscoLabel(status: 'em_dia' | 'atencao' | 'critico'): string {
  switch (status) {
    case 'em_dia':
      return 'Em dia';
    case 'atencao':
      return 'Atenção';
    case 'critico':
      return 'Crítico';
    default:
      return 'Indefinido';
  }
}