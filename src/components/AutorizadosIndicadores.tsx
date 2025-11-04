import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, XCircle } from "lucide-react";
import { useIndicadoresDesempenho } from "@/hooks/useAutorizadosPerformance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TipoParceiro } from "@/utils/parceiros";

interface AutorizadosIndicadoresProps {
  tipoParceiro: TipoParceiro;
}

export function AutorizadosIndicadores({ tipoParceiro }: AutorizadosIndicadoresProps) {
  const indicadores = useIndicadoresDesempenho(tipoParceiro);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Autorizados Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ativos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{indicadores.totalAtivos}</div>
          <p className="text-xs text-muted-foreground">
            Autorizados ativos
          </p>
        </CardContent>
      </Card>

      {/* Autorizados Premium */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Premium
          </CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{indicadores.totalPremium}</div>
          <p className="text-xs text-muted-foreground">
            Autorizados premium
          </p>
        </CardContent>
      </Card>

      {/* Autorizados Perdidos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Perdidos
          </CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{indicadores.totalPerdidos}</div>
          <p className="text-xs text-muted-foreground">
            Autorizados perdidos
          </p>
        </CardContent>
      </Card>

      {/* Distribuição por Atendente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Por Atendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {indicadores.distribuicaoPorAtendente.slice(0, 3).map((item) => (
              <div key={item.atendente_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={item.atendente_foto || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(item.atendente_nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{item.atendente_nome.split(' ')[0]}</span>
                </div>
                <span className="text-xs font-bold">{item.count}</span>
              </div>
            ))}
            {indicadores.distribuicaoPorAtendente.length > 3 && (
              <p className="text-xs text-muted-foreground pt-1">
                +{indicadores.distribuicaoPorAtendente.length - 3} mais
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}