import { useMemo } from "react";
import { Package } from "lucide-react";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { OrdensCarregamentoSlimTable } from "@/components/carregamento/OrdensCarregamentoSlimTable";
import { Card } from "@/components/ui/card";

export default function InstalacoesAdmin() {
  // Buscar todas as ordens de carregamento
  const { ordens, isLoading } = useOrdensCarregamento();

  // Filtrar apenas ordens com instalação (valor_instalacao > 0)
  const ordensInstalacao = ordens.filter(ordem => 
    ordem.venda?.valor_instalacao != null && ordem.venda.valor_instalacao > 0
  );

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
          <h1 className="text-2xl font-bold">Ordens de Carregamento - Instalações</h1>
          <p className="text-sm text-muted-foreground">
            Listagem de ordens de carregamento de pedidos de instalação
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{ordensInstalacao.length} {ordensInstalacao.length === 1 ? 'ordem' : 'ordens'}</span>
        </div>
      </div>

      {/* Tabela Slim */}
      <Card className="p-0">
        <OrdensCarregamentoSlimTable ordens={ordensInstalacao} />
      </Card>
    </div>
  );
}
