import { useEquipesInstalacao } from "@/hooks/useEquipesInstalacao";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useState } from "react";
import { GerenciarEquipes } from "@/components/cronograma/GerenciarEquipes";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface EquipesSliderProps {
  equipeSelecionadaId: string | null;
  onEquipeChange: (equipeId: string | null) => void;
}

export function EquipesSlider({ equipeSelecionadaId, onEquipeChange }: EquipesSliderProps) {
  const { equipes, loading } = useEquipesInstalacao();
  const [showGerenciarEquipes, setShowGerenciarEquipes] = useState(false);

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
          onClick={() => setShowGerenciarEquipes(true)}
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
              className="flex-shrink-0 h-9 gap-2"
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
              {equipe.cor && (
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: equipe.cor }}
                />
              )}
              {equipe.nome}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <GerenciarEquipes
        open={showGerenciarEquipes}
        onOpenChange={setShowGerenciarEquipes}
      />
    </div>
  );
}