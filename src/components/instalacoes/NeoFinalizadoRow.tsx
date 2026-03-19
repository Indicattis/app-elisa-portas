import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Hammer, Wrench, Truck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { FinalizadoItem } from "@/hooks/useNeoFinalizados";

interface NeoFinalizadoRowProps {
  item: FinalizadoItem;
}

const tipoConfig = {
  instalacao: { icon: Truck, color: "text-blue-500", badgeClass: "border-blue-500/30 text-blue-500 bg-blue-500/10", label: "Instalação" },
  neo_instalacao: { icon: Hammer, color: "text-orange-500", badgeClass: "border-orange-500/30 text-orange-500 bg-orange-500/10", label: "Neo Instalação" },
  neo_correcao: { icon: Wrench, color: "text-purple-500", badgeClass: "border-purple-500/30 text-purple-500 bg-purple-500/10", label: "Neo Correção" },
};

export function NeoFinalizadoRow({ item }: NeoFinalizadoRowProps) {
  const config = tipoConfig[item._tipo];
  const Icon = config.icon;
  const concluidaEm = item.concluida_em ? new Date(item.concluida_em) : null;

  const tempoRelativo = concluidaEm
    ? formatDistanceToNow(concluidaEm, { addSuffix: true, locale: ptBR })
    : null;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg",
        "bg-card/30 border border-border/30",
        "hover:bg-card/50 transition-colors",
        "h-[35px]"
      )}
    >
      <div className="shrink-0">
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
        {item.nome_cliente}
      </span>

      <Badge
        variant="outline"
        className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0", config.badgeClass)}
      >
        {config.label}
      </Badge>

      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
        {item.cidade}/{item.estado}
      </span>

      {tempoRelativo && (
        <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
          {tempoRelativo}
        </span>
      )}

      {item.concluidor && (
        <div className="flex items-center gap-1 shrink-0">
          <Avatar className="h-5 w-5">
            <AvatarImage src={item.concluidor.foto_perfil_url || undefined} />
            <AvatarFallback className="text-[9px] bg-emerald-500/20 text-emerald-600">
              {getInitials(item.concluidor.nome)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    </div>
  );
}
