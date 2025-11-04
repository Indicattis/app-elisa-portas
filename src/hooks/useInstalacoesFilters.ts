import { useState, useMemo } from "react";
import { isPast, startOfDay } from "date-fns";
import { InstalacaoCadastrada } from "./useInstalacoesCadastradas";

export interface InstalacoesFilters {
  search: string;
  status: string;
  estado: string;
  quickFilter: 'all' | 'sem_responsavel' | 'atrasados' | 'pendente_producao' | 'pronta_fabrica';
}

export const isAtrasado = (instalacao: InstalacaoCadastrada) => {
  if (!instalacao.data_instalacao || instalacao.status === 'finalizada') return false;
  return isPast(startOfDay(new Date(instalacao.data_instalacao))) && 
         startOfDay(new Date(instalacao.data_instalacao)) < startOfDay(new Date());
};

export function useInstalacoesFilters(instalacoes: InstalacaoCadastrada[] = []) {
  const [filters, setFilters] = useState<InstalacoesFilters>({
    search: "",
    status: "all",
    estado: "all",
    quickFilter: "all"
  });

  const filteredInstalacoes = useMemo(() => {
    if (!instalacoes || !Array.isArray(instalacoes)) {
      return [];
    }

    let result = [...instalacoes];

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(inst => 
        inst.nome_cliente?.toLowerCase().includes(searchLower) ||
        inst.telefone_cliente?.toLowerCase().includes(searchLower)
      );
    }

    // Filtros rápidos
    switch (filters.quickFilter) {
      case 'sem_responsavel':
        result = result.filter(inst => !inst.responsavel_instalacao_id);
        break;
      case 'atrasados':
        result = result.filter(inst => isAtrasado(inst));
        break;
      case 'pendente_producao':
        result = result.filter(inst => inst.status === 'pendente_producao');
        break;
      case 'pronta_fabrica':
        result = result.filter(inst => inst.status === 'pronta_fabrica');
        break;
      default:
        // Filtro de status do select (apenas quando quickFilter não é de status)
        if (filters.status !== 'all') {
          result = result.filter(inst => inst.status === filters.status);
        }
    }

    // Filtro de estado
    if (filters.estado !== 'all') {
      result = result.filter(inst => inst.estado === filters.estado);
    }

    return result;
  }, [instalacoes, filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      estado: "all",
      quickFilter: "all"
    });
  };

  return {
    filters,
    setFilters,
    filteredInstalacoes,
    clearFilters
  };
}
