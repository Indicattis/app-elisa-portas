import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flame, Clock, User, Droplet, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface PinturaInicio {
  id: string;
  iniciado_em: string;
  observacoes?: string | null;
  recarga_realizada: boolean;
  recarga_realizada_em?: string | null;
  recarga_realizada_por?: string | null;
  admin_users: {
    id: string;
    nome: string;
    foto_perfil_url?: string | null;
  } | null;
}

interface PinturaIniciosListProps {
  inicios: PinturaInicio[];
  isLoading: boolean;
  onToggleRecarga: (inicioId: string) => void;
  isTogglingRecarga?: boolean;
}

export function PinturaIniciosList({ inicios, isLoading, onToggleRecarga, isTogglingRecarga }: PinturaIniciosListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            Histórico de Fornadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (inicios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            Histórico de Fornadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Flame className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Nenhum início de pintura registrado ainda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            Histórico de Fornadas
          </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {inicios.map((inicio) => (
              <div
                key={inicio.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={inicio.admin_users?.foto_perfil_url || undefined} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {inicio.admin_users?.nome || "Usuário não encontrado"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(inicio.iniciado_em), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>

                  {inicio.observacoes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {inicio.observacoes}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant={inicio.recarga_realizada ? "default" : "outline"}
                  onClick={() => onToggleRecarga(inicio.id)}
                  disabled={isTogglingRecarga}
                  className={`h-[85px] w-[30%] ${inicio.recarga_realizada ? "bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/50" : ""}`}
                  title={inicio.recarga_realizada ? "Recarga realizada" : "Marcar recarga"}
                >
                  {inicio.recarga_realizada ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Droplet className="h-4 w-4 mr-2" />
                  )}
                  {inicio.recarga_realizada ? "Recargado" : "Recarregar"}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
