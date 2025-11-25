import { Package } from "lucide-react";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { OrdensCarregamentoSlimTable } from "@/components/carregamento/OrdensCarregamentoSlimTable";
import { Card } from "@/components/ui/card";

export default function Entregas() {
  // Buscar todas as ordens de carregamento
  const { ordens, isLoading } = useOrdensCarregamento();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Carregamento - Entregas</h1>
          <p className="text-sm text-muted-foreground">
            Listagem de ordens de carregamento de pedidos de entrega
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{ordens.length} {ordens.length === 1 ? 'ordem' : 'ordens'}</span>
        </div>
      </div>

      {/* Tabela Slim */}
      <Card className="p-0">
        <OrdensCarregamentoSlimTable ordens={ordens} />
      </Card>
    </div>
  );
}
