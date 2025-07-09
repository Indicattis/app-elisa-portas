import { useVisitas } from "@/hooks/useVisitas";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TURNO_LABELS, STATUS_LABELS } from "@/types/visita";

export default function Visitas() {
  const { visitas, loading, marcarConcluida, cancelarVisita } = useVisitas();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'default';
      case 'concluida':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const canManageVisita = (visita: any) => {
    return visita.responsavel_id === user?.id;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visitas Técnicas</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe as visitas técnicas agendadas</p>
        </div>
      </div>

      <div className="grid gap-4">
        {visitas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma visita técnica cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          visitas.map((visita) => (
            <Card key={visita.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {visita.lead.nome}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Telefone: {visita.lead.telefone}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(visita.status)}>
                    {STATUS_LABELS[visita.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {format(new Date(visita.data_visita), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{TURNO_LABELS[visita.turno]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {visita.lead.endereco_rua}, {visita.lead.endereco_numero} - {visita.lead.endereco_bairro}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>Responsável: {visita.responsavel_nome}</span>
                  </div>
                </div>

                {visita.observacoes && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Observações:</p>
                    <p className="text-sm">{visita.observacoes}</p>
                  </div>
                )}

                {visita.status === 'agendada' && canManageVisita(visita) && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => marcarConcluida(visita.id)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar como Concluída
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => cancelarVisita(visita.id)}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar Visita
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}