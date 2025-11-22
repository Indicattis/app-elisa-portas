import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import { useCoresPintadasHoje } from "@/hooks/useCoresPintadasHoje";

export function CoresPintadasHoje() {
  const { data: cores = [], isLoading } = useCoresPintadasHoje();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cores Pintadas Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Cores Pintadas Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {cores.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma peça pintada hoje
          </p>
        ) : (
          <div className="space-y-2">
            {cores.map((cor) => (
              <div
                key={cor.cor_nome}
                className="flex items-center justify-between py-2 px-3 border rounded hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-primary/60" />
                  <span className="text-sm font-medium">{cor.cor_nome}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
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
