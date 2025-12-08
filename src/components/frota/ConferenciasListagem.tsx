import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Conferencia } from "@/hooks/useConferencias";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, AlertTriangle, Wrench, Car } from "lucide-react";

interface ConferenciasListagemProps {
  conferencias: Conferencia[];
  isLoading: boolean;
}

const statusConfig = {
  pronto: { label: "Pronto", variant: "default" as const, icon: CheckCircle, color: "text-green-500" },
  atencao: { label: "Atenção", variant: "secondary" as const, icon: AlertTriangle, color: "text-yellow-500" },
  critico: { label: "Crítico", variant: "destructive" as const, icon: XCircle, color: "text-red-500" },
  mecanico: { label: "Mecânico", variant: "outline" as const, icon: Wrench, color: "text-blue-500" },
  em_uso: { label: "Em Uso", variant: "secondary" as const, icon: Car, color: "text-purple-500" },
};

export function ConferenciasListagem({ conferencias, isLoading }: ConferenciasListagemProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!conferencias || conferencias.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma conferência registrada para este veículo.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">Foto</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>KM Atual</TableHead>
          <TableHead>Água</TableHead>
          <TableHead>Troca de Óleo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conferencias.map((conferencia) => {
          const status = statusConfig[conferencia.status] || statusConfig.pronto;
          const StatusIcon = status.icon;
          
          return (
            <TableRow key={conferencia.id}>
              <TableCell>
                {conferencia.foto_url ? (
                  <img
                    src={conferencia.foto_url}
                    alt="Foto da conferência"
                    className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => window.open(conferencia.foto_url, '_blank')}
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                    -
                  </div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(conferencia.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant} className="gap-1">
                  <StatusIcon className={`h-3 w-3 ${status.color}`} />
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell>{conferencia.km_atual.toLocaleString('pt-BR')} km</TableCell>
              <TableCell>
                {conferencia.agua_conferida ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </TableCell>
              <TableCell>
                {conferencia.data_troca_oleo
                  ? format(new Date(conferencia.data_troca_oleo), "dd/MM/yyyy", { locale: ptBR })
                  : "-"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
