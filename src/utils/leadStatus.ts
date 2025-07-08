import { isToday } from "date-fns";
import type { Lead } from "@/types/lead";

export const getLeadStatus = (lead: Lead) => {
  const dataEnvio = new Date(lead.data_envio);
  const isFromToday = isToday(dataEnvio);
  
  switch (lead.status_atendimento) {
    case 1:
      // Se é do dia atual, é "novo", senão é "aguardando"
      return isFromToday ? "novo" : "aguardando";
    case 2:
      return "em_andamento";
    case 3:
      return "pausado";
    case 5:
      return "vendido";
    case 6:
      return "cancelado";
    default:
      return "aguardando";
  }
};

export const statusConfig = {
  novo: { label: "Novo", className: "bg-blue-500" },
  aguardando: { label: "Aguardando", className: "bg-gray-500" },
  em_andamento: { label: "Em Andamento", className: "bg-green-500" },
  pausado: { label: "Pausado", className: "bg-yellow-500" },
  vendido: { label: "Vendido", className: "bg-green-600" },
  cancelado: { label: "Cancelado", className: "bg-red-500" },
};