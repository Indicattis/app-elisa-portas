
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
    case 3:
      return "pausado";
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
  aguardando_atendente: { label: "Aguardando atendente", className: "bg-gray-500" },
  em_andamento: { label: "Em andamento", className: "bg-blue-500" },
  pausado: { label: "Pausado", className: "bg-yellow-500" },
  aguardando_aprovacao_venda: { label: "Aguardando aprovação de venda", className: "bg-orange-500" },
  vendido: { label: "Vendido", className: "bg-green-600" },
  desqualificado: { label: "Desqualificado", className: "bg-red-500" },
  venda_perdida: { label: "Venda perdida", className: "bg-red-700" },
};
