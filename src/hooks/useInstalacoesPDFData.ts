import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Instalacao } from "@/types/instalacao";
import { useEquipesInstalacao } from "./useEquipesInstalacao";
import { CronogramaInstalacoesPDFData } from "@/utils/instalacoesCronogramaPDF";

export const useInstalacoesPDFData = () => {
  const { equipes } = useEquipesInstalacao();

  const prepararDadosPDF = (
    instalacoes: Instalacao[],
    equipeSelecionadaId: string | null,
    currentDate: Date,
    tipoVisualizacao: 'semanal' | 'mensal'
  ): CronogramaInstalacoesPDFData => {
    // Calcular período
    const periodoInicio = tipoVisualizacao === 'semanal'
      ? startOfWeek(currentDate, { weekStartsOn: 0 })
      : startOfMonth(currentDate);
    
    const periodoFim = tipoVisualizacao === 'semanal'
      ? endOfWeek(currentDate, { weekStartsOn: 0 })
      : endOfMonth(currentDate);

    // Encontrar equipe selecionada
    const equipeSelecionada = equipeSelecionadaId
      ? equipes.find(e => e.id === equipeSelecionadaId) || null
      : null;

    return {
      instalacoes,
      equipes,
      periodoInicio,
      periodoFim,
      equipeSelecionada,
      tipoVisualizacao,
    };
  };

  return { prepararDadosPDF, equipes };
};
