import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Users, Phone, MapPin, FileText, User } from "lucide-react";

interface InstalacaoCardProps {
  instalacao: InstalacaoCalendario;
  onClick: () => void;
  compact?: boolean;
}

export const InstalacaoCard = ({ instalacao, onClick, compact = false }: InstalacaoCardProps) => {
  const corEquipe = instalacao._corEquipe || instalacao.equipe?.cor || "#3B82F6";

  // Obter informações de localização
  const cidade = instalacao.cidade || instalacao.venda?.cidade;
  const estado = instalacao.estado || instalacao.venda?.estado;
  const endereco = instalacao.endereco;
  const telefone = instalacao.telefone_cliente || instalacao.venda?.cliente_telefone;
  const responsavel = instalacao.equipe?.nome || instalacao.responsavel_instalacao_nome;

  const localizacao = [endereco, cidade, estado].filter(Boolean).join(", ");

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-3">
          <div className="space-y-2">
            {/* Cliente */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{instalacao.nome_cliente}</span>
            </div>

            {/* Horário */}
            {instalacao.hora && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{instalacao.hora.slice(0, 5)}</span>
              </div>
            )}

            {/* Responsável/Equipe */}
            {responsavel && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{responsavel}</span>
              </div>
            )}

            {/* Telefone */}
            {telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{telefone}</span>
              </div>
            )}

            {/* Localização */}
            {localizacao && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm">{localizacao}</span>
              </div>
            )}

            {/* Observações */}
            {instalacao.observacoes && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Observações:</span>
                    <span className="text-sm whitespace-pre-line">{instalacao.observacoes}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
