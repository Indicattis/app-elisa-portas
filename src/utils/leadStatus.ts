
import { isToday } from "date-fns";
import type { Lead } from "@/types/lead";

export const getLeadStatus = (lead: Lead) => {
  // Verificar se tem requisição de venda pendente
  const hasVendaRequest = lead.status_atendimento === 4; // Status específico para aguardando aprovação
  
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
    rowClassName: "bg-blue-50 hover:bg-blue-100"
  },
  em_andamento: { 
    label: "Em andamento", 
    className: "bg-blue-500",
    rowClassName: "bg-white hover:bg-gray-50"
  },
  aguardando_aprovacao_venda: { 
    label: "Aguardando aprovação de venda", 
    className: "bg-orange-500",
    rowClassName: "bg-yellow-50 hover:bg-yellow-100"
  },
  vendido: { 
    label: "Vendido", 
    className: "bg-green-600",
    rowClassName: "bg-green-50 hover:bg-green-100"
  },
  desqualificado: { 
    label: "Desqualificado", 
    className: "bg-red-500",
    rowClassName: "bg-gray-100 hover:bg-gray-200 opacity-60"
  },
  venda_perdida: { 
    label: "Venda perdida", 
    className: "bg-red-700",
    rowClassName: "bg-red-50 hover:bg-red-100"
  },
};
