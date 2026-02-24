import { Package, Filter } from "lucide-react";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { OrdensCarregamentoSlimTable } from "@/components/carregamento/OrdensCarregamentoSlimTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function Entregas() {
  // Estado do filtro de carregamentos concluídos
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false);
  
  // Buscar todas as ordens de carregamento
  const { ordens, isLoading } = useOrdensCarregamento();

  // Filtrar apenas ordens SEM instalação (valor_instalacao = 0 ou null)
  // E filtrar por status de conclusão baseado no filtro
  const ordensEntrega = ordens.filter(ordem => {
    const semInstalacao = ordem.venda?.valor_instalacao == null || ordem.venda.valor_instalacao === 0;
    const filtroStatus = mostrarConcluidos || ordem.status !== 'concluida';
    const naoECorrecao = ordem.fonte !== 'correcoes';
    return semInstalacao && filtroStatus && naoECorrecao;
  });

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
        
        <div className="flex items-center gap-3">
          <Button
            variant={mostrarConcluidos ? "outline" : "default"}
            size="sm"
            onClick={() => setMostrarConcluidos(!mostrarConcluidos)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {mostrarConcluidos ? "Mostrar Apenas Pendentes" : "Mostrar Todos"}
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{ordensEntrega.length} {ordensEntrega.length === 1 ? 'ordem' : 'ordens'}</span>
            {!mostrarConcluidos && (
              <Badge variant="secondary" className="text-xs">
                Pendentes
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabela Slim */}
      <Card className="p-0">
        <OrdensCarregamentoSlimTable ordens={ordensEntrega} />
      </Card>
    </div>
  );
}
