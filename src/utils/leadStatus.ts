
import { isToday } from "date-fns";
import type { Lead } from "@/types/lead";

export const getLeadStatus = (lead: Lead) => {
  switch (lead.status_atendimento) {
    case 1:
      // Aguardando atendente (sem atendente)
      return "aguardando_atendente";
    case 2:
      // Em andamento (capturado)
      return "em_andamento";
    case 4:
      // Aguardando aprovação de venda
      return "aguardando_aprovacao_venda";
    case 5:
      // Vendido (requisição aprovada)
      return "vendido";
    case 6:
      // Desqualificado (cancelado)
      return "desqualificado";
    case 7:
      // Venda perdida
      return "venda_perdida";
    default:
      return "aguardando_atendente";
  }
};

export const statusConfig = {
  aguardando_atendente: { 
    label: "Aguardando atendente", 
    className: "bg-gray-500",
    rowClassName: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
  },
  em_andamento: { 
    label: "Em andamento", 
    className: "bg-blue-500",
    rowClassName: "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
  },
  aguardando_aprovacao_venda: { 
    label: "Aguardando aprovação de venda", 
    className: "bg-orange-500",
    rowClassName: "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:hover:bg-yellow-950/50"
  },
  vendido: { 
    label: "Vendido", 
    className: "bg-green-600",
    rowClassName: "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50"
  },
  desqualificado: { 
    label: "Desqualificado", 
    className: "bg-red-500",
    rowClassName: "bg-gray-100 hover:bg-gray-200 opacity-60 dark:bg-gray-800/60 dark:hover:bg-gray-700/60"
  },
  venda_perdida: { 
    label: "Venda perdida", 
    className: "bg-red-700",
    rowClassName: "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
  },
};
