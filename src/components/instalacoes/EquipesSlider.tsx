import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { Button } from "@/components/ui/button";
import { Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EquipesSliderProps {
  equipeSelecionadaId: string | null;
  onEquipeChange: (equipeId: string | null) => void;
}

export function EquipesSlider({ equipeSelecionadaId, onEquipeChange }: EquipesSliderProps) {
  const { equipes, loading } = useEquipesInstalacao();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
        <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Equipes
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/instalacoes/equipes')}
          className="h-7 gap-1 text-xs"
        >
          <Settings className="h-3 w-3" />
          Gerenciar
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={equipeSelecionadaId === null ? "default" : "outline"}
            size="sm"
            onClick={() => onEquipeChange(null)}
            className="flex-shrink-0 h-9"
          >
            Todas
          </Button>
          
          {equipes.map((equipe) => (
            <Button
              key={equipe.id}
              variant={equipeSelecionadaId === equipe.id ? "default" : "outline"}
              size="sm"
              onClick={() => onEquipeChange(equipe.id)}
              className="flex-shrink-0 h-auto py-3 px-4 gap-3"
              style={
                equipeSelecionadaId === equipe.id && equipe.cor
                  ? {
                      backgroundColor: equipe.cor,
                      borderColor: equipe.cor,
                      color: "#fff",
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-3">
                {/* Foto do Líder */}
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={equipe.responsavel_foto} alt={equipe.responsavel_nome} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Informações da Equipe */}
                <div className="flex items-center gap-2">
                  {equipe.cor && (
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: equipe.cor }}
                    />
                  )}
                  <span className="font-semibold text-sm">{equipe.nome}</span>
                </div>
              </div>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}