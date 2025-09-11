import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIndicadoresDesempenho } from "@/hooks/useAutorizadosPerformance";
import { AlertTriangle, CheckCircle, Users, Trophy, Clock } from "lucide-react";
import { StarRating } from "./StarRating";

export function AutorizadosIndicadores() {
  const indicadores = useIndicadoresDesempenho();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{indicadores.totalAtivos}</div>
          <p className="text-xs text-muted-foreground">Autorizados cadastrados</p>
        </CardContent>
      </Card>

      {/* Não Aptos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Não Aptos</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{indicadores.naoAptos}</div>
          <p className="text-xs text-muted-foreground">Em processo de capacitação</p>
        </CardContent>
      </Card>

      {/* Zona de Risco */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Zona de Risco</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{indicadores.zonaRisco}</div>
          <p className="text-xs text-muted-foreground">2+ meses sem avaliação</p>
        </CardContent>
      </Card>

      {/* Críticos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Críticos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{indicadores.criticos}</div>
          <p className="text-xs text-muted-foreground">3+ meses sem avaliação</p>
        </CardContent>
      </Card>

      {/* Ranking Top 5 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top 5 - Melhores Avaliados
          </CardTitle>
          <CardDescription>Ranking dos autorizados com melhor desempenho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {indicadores.ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda</p>
            ) : (
              indicadores.ranking.map((item, index) => (
                <div key={item.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">{item.total_avaliacoes} avaliações</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating rating={Number(item.rating)} size={16} />
                    <span className="text-sm font-medium ml-1">{Number(item.rating).toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Atendente */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Distribuição por Atendente
          </CardTitle>
          <CardDescription>Quantidade de autorizados por vendedor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {indicadores.distribuicaoPorAtendente.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum atendente atribuído</p>
            ) : (
              indicadores.distribuicaoPorAtendente.map((item) => (
                <div key={item.nome} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={item.foto} />
              <AvatarFallback className="text-xs">
                {getInitials(item.nome)}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-sm">{item.nome}</p>
          </div>
          <Badge variant="secondary">
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