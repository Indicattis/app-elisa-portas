
import { isToday } from "date-fns";
import type { Lead } from "@/types/lead";

export const getLeadStatus = (lead: Lead) => {
  // Agora usa novo_status diretamente
  return lead.novo_status || "aguardando_atendimento";
};

export const statusConfig = {
  aguardando_atendimento: { 
    label: "Aguardando atendimento", 
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
  venda_aprovada: { 
    label: "Venda aprovada", 
    className: "bg-green-600",
    rowClassName: "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50"
  },
  perdido: { 
    label: "Perdido", 
    className: "bg-red-500",
    rowClassName: "bg-gray-100 hover:bg-gray-200 opacity-60 dark:bg-gray-800/60 dark:hover:bg-gray-700/60"
  },
  venda_reprovada: { 
    label: "Venda reprovada", 
    className: "bg-red-700",
    rowClassName: "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
  },
};
