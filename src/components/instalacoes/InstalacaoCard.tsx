import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InstalacaoCardProps {
  instalacao: InstalacaoCalendario;
  onClick: () => void;
  compact?: boolean;
}

export const InstalacaoCard = ({ instalacao, onClick, compact = false }: InstalacaoCardProps) => {
  const navigate = useNavigate();
  const corEquipe = instalacao._corEquipe || instalacao.equipe?.cor || "#3B82F6";

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/instalacoes/${instalacao.id}/editar`);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md border-l-4 transition-all hover:shadow-md group relative",
        compact ? "p-1 text-xs" : "p-2 text-sm"
      )}
      style={{ borderLeftColor: corEquipe, backgroundColor: `${corEquipe}15` }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {instalacao.nome_cliente}
          </div>
          {!compact && instalacao.hora && (
            <div className="text-muted-foreground text-xs">
              {instalacao.hora.slice(0, 5)}
            </div>
          )}
          {!compact && instalacao.equipe?.nome && (
            <div className="text-muted-foreground text-xs truncate">
              {instalacao.equipe.nome}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEditClick}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}
        >
          <Pencil className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </Button>
      </div>
    </div>
  );
};
