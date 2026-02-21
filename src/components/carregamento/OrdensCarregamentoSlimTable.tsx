import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Calendar, User, CheckCircle2, XCircle, AlertCircle, Check } from "lucide-react";

interface OrdensCarregamentoSlimTableProps {
  ordens: OrdemCarregamento[];
  onConcluirOrdem?: (id: string) => Promise<void>;
}

export const OrdensCarregamentoSlimTable = ({ ordens, onConcluirOrdem }: OrdensCarregamentoSlimTableProps) => {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'concluida':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Concluída</span>
          </div>
        );
      case 'carregada':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Carregada</span>
          </div>
        );
      case 'agendada':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Agendada</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Pendente</span>
          </div>
        );
    }
  };

  const getCarregamentoBadge = (dataCarregamento: string | null) => {
    if (dataCarregamento) {
      return <Badge variant="default" className="h-5 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Agendado
      </Badge>;
    }
    return <Badge variant="secondary" className="h-5 text-xs">
      <XCircle className="h-3 w-3 mr-1" />
      Pendente Agendamento
    </Badge>;
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
      <div className="grid grid-cols-[2fr,1.5fr,1fr,1.5fr,1.5fr,1fr,1fr,auto] gap-4 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
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
        <div>Carregamento</div>
        {onConcluirOrdem && <div>Ações</div>}
      </div>

      {/* Rows */}
      <div className="divide-y">
        {ordens.map((ordem) => (
          <div
            key={ordem.id}
            className="grid grid-cols-[2fr,1.5fr,1fr,1.5fr,1.5fr,1fr,1fr,auto] gap-4 px-4 py-2 hover:bg-muted/30 transition-colors items-center text-sm h-[35px]"
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
                  <span>{format(new Date(ordem.data_carregamento + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}</span>
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

            {/* Carregamento */}
            <div>
              {getCarregamentoBadge(ordem.data_carregamento)}
            </div>

            {/* Ações */}
            {onConcluirOrdem && (
              <div>
                {ordem.status === 'carregada' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConcluirOrdem(ordem.id)}
                    className="h-7 text-xs gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Concluir
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
