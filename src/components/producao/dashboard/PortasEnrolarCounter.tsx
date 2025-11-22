import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePortasEnrolarProduzidasHoje } from "@/hooks/usePortasEnrolarProduzidasHoje";

export function PortasEnrolarCounter() {
  const { data: totalPortas = 0, isLoading } = usePortasEnrolarProduzidasHoje();

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Portas de Enrolar Produzidas Hoje</p>
              <div className="h-8 w-20 bg-muted animate-pulse rounded mt-0.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Portas de Enrolar Produzidas Hoje</p>
            <p className="text-3xl font-bold text-primary mt-0.5">{Number(totalPortas)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
