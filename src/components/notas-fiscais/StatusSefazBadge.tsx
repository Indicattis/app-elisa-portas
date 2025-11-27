import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Ban, Loader2 } from "lucide-react";

interface StatusSefazBadgeProps {
  status: string;
}

export function StatusSefazBadge({ status }: StatusSefazBadgeProps) {
  const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
    autorizada: {
      label: "Autorizada",
      variant: "default",
      icon: CheckCircle,
    },
    processando: {
      label: "Processando",
      variant: "secondary",
      icon: Loader2,
    },
    pendente: {
      label: "Pendente",
      variant: "secondary",
      icon: Clock,
    },
    rejeitada: {
      label: "Rejeitada",
      variant: "destructive",
      icon: XCircle,
    },
    cancelada: {
      label: "Cancelada",
      variant: "outline",
      icon: Ban,
    },
  };

  const statusInfo = statusMap[status?.toLowerCase()] || {
    label: status || "Desconhecido",
    variant: "secondary",
    icon: Clock,
  };

  const Icon = statusInfo.icon;

  return (
    <Badge variant={statusInfo.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {statusInfo.label}
    </Badge>
  );
}
