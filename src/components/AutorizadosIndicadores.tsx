import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIndicadoresDesempenho } from "@/hooks/useAutorizadosPerformance";
import { AlertTriangle, CheckCircle, Users, Trophy, Clock } from "lucide-react";
import { StarRating } from "./StarRating";
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* Total Ativos */}
      <Card className="h-20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Total Ativos</CardTitle>
          <Users className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg font-bold">{indicadores.totalAtivos}</div>
        </CardContent>
      </Card>

      {/* Não Aptos */}
      <Card className="h-20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Não Aptos</CardTitle>
          <Clock className="h-3 w-3 text-yellow-500" />
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg font-bold text-yellow-600">{indicadores.naoAptos}</div>
        </CardContent>
      </Card>

      {/* Zona de Risco */}
      <Card className="h-20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Zona de Risco</CardTitle>
          <AlertTriangle className="h-3 w-3 text-orange-500" />
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg font-bold text-orange-600">{indicadores.zonaRisco}</div>
        </CardContent>
      </Card>

      {/* Críticos */}
      <Card className="h-20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Críticos</CardTitle>
          <AlertTriangle className="h-3 w-3 text-red-500" />
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg font-bold text-red-600">{indicadores.criticos}</div>
        </CardContent>
      </Card>

      {/* Ranking Top 5 */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="h-3 w-3 text-yellow-500" />
            Top 5 - Melhores Avaliados
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-2">
            {indicadores.ranking.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma avaliação ainda</p>
            ) : (
              indicadores.ranking.map((item, index) => (
                <div key={item.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-xs">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">{item.total_avaliacoes} avaliações</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating rating={Number(item.rating)} size={12} />
                    <span className="text-xs font-medium ml-1">{Number(item.rating).toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Atendente */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-3 w-3 text-blue-500" />
            Distribuição por Atendente
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-2">
            {indicadores.distribuicaoPorAtendente.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum atendente atribuído</p>
            ) : (
              indicadores.distribuicaoPorAtendente.map((item) => (
                <div key={item.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.foto} />
                      <AvatarFallback className="text-xs">
                        {getInitials(item.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-xs">{item.nome}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.quantidade}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}