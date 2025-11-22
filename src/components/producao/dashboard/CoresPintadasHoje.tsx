import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import { useCoresPintadasHoje } from "@/hooks/useCoresPintadasHoje";

export function CoresPintadasHoje() {
  const { data: cores = [], isLoading } = useCoresPintadasHoje();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Cores Pintadas Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-1 px-3 pt-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5" />
          Cores Pintadas Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2 px-3">
        {cores.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Nenhuma peça pintada hoje
          </p>
        ) : (
          <div className="space-y-1">
            {cores.map((cor) => (
              <div
                key={cor.cor_nome}
                className="flex items-center justify-between py-1 px-1.5 border rounded hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-primary/60" />
                  <span className="text-[11px] font-medium">{cor.cor_nome}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] py-0 px-1">
                  {cor.quantidade_pecas} {cor.quantidade_pecas === 1 ? 'peça' : 'peças'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
