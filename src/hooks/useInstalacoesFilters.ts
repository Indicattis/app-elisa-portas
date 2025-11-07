import { useState, useMemo } from "react";
import { isPast, startOfDay } from "date-fns";
import { InstalacaoCadastrada } from "./useInstalacoesCadastradas";

export interface InstalacoesFilters {
  search: string;
  status: string;
  estado: string;
  quickFilter: string;
}

export const isAtrasado = (instalacao: InstalacaoCadastrada) => {
  if (!instalacao.data_instalacao || instalacao.status === 'finalizada') return false;
  return isPast(startOfDay(new Date(instalacao.data_instalacao))) && 
         startOfDay(new Date(instalacao.data_instalacao)) < startOfDay(new Date());
};

export function useInstalacoesFilters(instalacoes: InstalacaoCadastrada[] = []) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<string>("all");

  const filteredInstalacoes = useMemo(() => {
    if (!instalacoes || !Array.isArray(instalacoes)) {
      return [];
    }

    return instalacoes.filter((instalacao) => {
      // Busca por nome do cliente ou telefone
      const matchesSearch = instalacao.nome_cliente
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        instalacao.telefone_cliente
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filtro por quick filter (prioritário sobre status select)
      if (quickFilter !== "all") {
        if (quickFilter === "pendentes" && instalacao.status !== "pendente_producao") return false;
        if (quickFilter === "prontas" && instalacao.status !== "pronta_fabrica") return false;
        if (quickFilter === "concluidas" && instalacao.status !== "finalizada") return false;
        if (quickFilter === "sem_responsavel" && instalacao.responsavel_instalacao_id) return false;
        if (quickFilter === "atrasadas") {
          const isAtrasada = instalacao.data_instalacao && 
            new Date(instalacao.data_instalacao) < new Date() && 
            instalacao.status !== "finalizada";
          if (!isAtrasada) return false;
        }
      } else if (filterStatus !== "all" && instalacao.status !== filterStatus) {
        return false;
      }

      // Filtro por estado
      if (filterEstado !== "all" && instalacao.estado !== filterEstado) {
        return false;
      }

      return true;
    });
  }, [instalacoes, searchTerm, filterStatus, filterEstado, quickFilter]);

  const sortedInstalacoes = useMemo(() => {
    return [...filteredInstalacoes].sort((a, b) => {
      // Priorizar atrasadas
      const aAtrasada = a.data_instalacao && new Date(a.data_instalacao) < new Date() && a.status !== "finalizada";
      const bAtrasada = b.data_instalacao && new Date(b.data_instalacao) < new Date() && b.status !== "finalizada";
      
      if (aAtrasada && !bAtrasada) return -1;
      if (!aAtrasada && bAtrasada) return 1;

      // Depois por data de instalação
      if (a.data_instalacao && b.data_instalacao) {
        return new Date(a.data_instalacao).getTime() - new Date(b.data_instalacao).getTime();
      }
      
      return 0;
    });
  }, [filteredInstalacoes]);

  const estados = useMemo(() => {
    const uniqueEstados = new Set(instalacoes.map((i) => i.estado));
    return Array.from(uniqueEstados).sort();
  }, [instalacoes]);

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterEstado,
    setFilterEstado,
    quickFilter,
    setQuickFilter,
    filteredInstalacoes: sortedInstalacoes,
    estados,
  };
}
