import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, Calendar, User } from "lucide-react";

interface OrdensCarregamentoSlimTableProps {
  ordens: OrdemCarregamento[];
}

export const OrdensCarregamentoSlimTable = ({ ordens }: OrdensCarregamentoSlimTableProps) => {
  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pendente: { label: "Pendente", variant: "secondary" },
      agendada: { label: "Agendada", variant: "default" },
      concluida: { label: "Concluída", variant: "outline" },
      em_coleta: { label: "Em Coleta", variant: "default" },
    };
    
    const config = statusMap[status || "pendente"];
    return <Badge variant={config.variant} className="h-5 text-xs">{config.label}</Badge>;
  };

  if (ordens.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma ordem de carregamento encontrada
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="grid grid-cols-[2fr,1.5fr,1fr,1.5fr,1.5fr,1fr] gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
        <div>Cliente</div>
        <div>Localização</div>
        <div>Status</div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Data Carregamento
        </div>
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Responsável
        </div>
        <div>Tipo</div>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {ordens.map((ordem) => (
          <div
            key={ordem.id}
            className="grid grid-cols-[2fr,1.5fr,1fr,1.5fr,1.5fr,1fr] gap-4 px-4 py-2 hover:bg-muted/30 transition-colors items-center text-sm h-[35px]"
          >
            {/* Cliente */}
            <div className="font-medium truncate">
              {ordem.nome_cliente}
            </div>

            {/* Localização */}
            <div className="flex items-center gap-1 text-muted-foreground truncate text-xs">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {ordem.venda?.cidade && ordem.venda?.estado
                  ? `${ordem.venda.cidade}, ${ordem.venda.estado}`
                  : "-"}
              </span>
            </div>

            {/* Status */}
            <div>
              {getStatusBadge(ordem.status)}
            </div>

            {/* Data Carregamento */}
            <div className="text-xs">
              {ordem.data_carregamento ? (
                <div className="flex flex-col">
                  <span>{format(new Date(ordem.data_carregamento), "dd/MM/yyyy", { locale: ptBR })}</span>
                  {ordem.hora && <span className="text-muted-foreground">{ordem.hora}</span>}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>

            {/* Responsável */}
            <div className="text-xs truncate">
              {ordem.responsavel_carregamento_nome || (
                <span className="text-muted-foreground">Não atribuído</span>
              )}
            </div>

            {/* Tipo */}
            <div>
              {ordem.tipo_carregamento === "elisa" ? (
                <Badge variant="default" className="h-5 text-xs">
                  <Truck className="h-3 w-3 mr-1" />
                  Elisa
                </Badge>
              ) : ordem.tipo_carregamento === "autorizados" ? (
                <Badge variant="secondary" className="h-5 text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Autorizados
                </Badge>
              ) : (
                <span className="text-muted-foreground text-xs">-</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
