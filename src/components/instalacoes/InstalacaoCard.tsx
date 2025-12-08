import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { cn } from "@/lib/utils";

interface InstalacaoCardProps {
  instalacao: InstalacaoCalendario;
  onClick: () => void;
  compact?: boolean;
}

export const InstalacaoCard = ({ instalacao, onClick, compact = false }: InstalacaoCardProps) => {
  const corEquipe = instalacao._corEquipe || instalacao.equipe?.cor || "#3B82F6";

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md border-l-4 transition-all hover:shadow-md",
        compact ? "p-1 text-xs" : "p-2 text-sm"
      )}
      style={{ borderLeftColor: corEquipe, backgroundColor: `${corEquipe}15` }}
    >
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
  );
};
