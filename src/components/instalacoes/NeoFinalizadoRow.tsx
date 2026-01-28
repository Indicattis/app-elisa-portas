import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Hammer, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { NeoInstalacao } from "@/types/neoInstalacao";
import type { NeoCorrecao } from "@/types/neoCorrecao";

type NeoFinalizadoItem = (NeoInstalacao | NeoCorrecao) & {
  concluidor?: {
    id: string;
    nome: string;
    foto_perfil_url: string | null;
  } | null;
};

interface NeoFinalizadoRowProps {
  item: NeoFinalizadoItem;
}

export function NeoFinalizadoRow({ item }: NeoFinalizadoRowProps) {
  const isInstalacao = item._tipo === 'neo_instalacao';
  const concluidaEm = item.concluida_em ? new Date(item.concluida_em) : null;

  const tempoRelativo = concluidaEm
    ? formatDistanceToNow(concluidaEm, { addSuffix: true, locale: ptBR })
    : null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg",
        "bg-card/30 border border-border/30",
        "hover:bg-card/50 transition-colors",
        "h-[35px]"
      )}
    >
      {/* Ícone do tipo */}
      <div className="shrink-0">
        {isInstalacao ? (
          <Hammer className="h-4 w-4 text-orange-500" />
        ) : (
          <Wrench className="h-4 w-4 text-purple-500" />
        )}
      </div>

      {/* Nome do cliente */}
      <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
        {item.nome_cliente}
      </span>

      {/* Badge do tipo */}
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5 py-0 h-5 shrink-0",
          isInstalacao
            ? "border-orange-500/30 text-orange-500 bg-orange-500/10"
            : "border-purple-500/30 text-purple-500 bg-purple-500/10"
        )}
      >
        {isInstalacao ? "Instalação" : "Correção"}
      </Badge>

      {/* Localização */}
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
        {item.cidade}/{item.estado}
      </span>

      {/* Tempo relativo */}
      {tempoRelativo && (
        <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
          {tempoRelativo}
        </span>
      )}

      {/* Quem concluiu */}
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

      {/* Ícone de conclusão */}
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    </div>
  );
}
