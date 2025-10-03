import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  isFaturada: boolean;
}

export function StatusBadge({ isFaturada }: StatusBadgeProps) {
  if (isFaturada) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Faturada
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
      <XCircle className="w-3 h-3 mr-1" />
      Não Faturada
    </Badge>
  );
}
