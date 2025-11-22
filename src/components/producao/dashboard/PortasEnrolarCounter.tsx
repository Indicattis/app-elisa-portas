import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePortasEnrolarProduzidasHoje } from "@/hooks/usePortasEnrolarProduzidasHoje";

export function PortasEnrolarCounter() {
  const { data: totalPortas = 0, isLoading } = usePortasEnrolarProduzidasHoje();

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portas de Enrolar Produzidas Hoje</p>
              <div className="h-10 w-24 bg-muted animate-pulse rounded mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Portas de Enrolar Produzidas Hoje</p>
            <p className="text-4xl font-bold text-primary mt-1">{Number(totalPortas)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
