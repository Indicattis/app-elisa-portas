import { FiltrosAutorizados } from "@/components/AutorizadosFiltros";
import { AutorizadoPerformance } from "@/hooks/useAutorizadosPerformance";
import { getCurrentEtapa } from "./parceiros";

export function aplicarFiltros(
  autorizados: AutorizadoPerformance[],
  filtros: FiltrosAutorizados
): AutorizadoPerformance[] {
  return autorizados.filter((autorizado) => {
    // Filtro de busca
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const matches = [
        autorizado.nome?.toLowerCase(),
        autorizado.email?.toLowerCase(),
        autorizado.cidade?.toLowerCase(),
        autorizado.estado?.toLowerCase(),
        autorizado.responsavel?.toLowerCase(),
      ].some((field) => field?.includes(busca));

      if (!matches) return false;
    }

    // Filtro de etapa
    if (filtros.etapa && filtros.etapa !== 'todos') {
      const etapaAtual = getCurrentEtapa(autorizado);
      if (etapaAtual !== filtros.etapa) return false;
    }

    // Filtro de atendente
    if (filtros.atendente && filtros.atendente !== 'todos') {
      if (autorizado.vendedor_id !== filtros.atendente) return false;
    }

    return true;
  });
}
