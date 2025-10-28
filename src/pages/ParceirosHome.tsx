import { Users, MapPin, TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParceirosDashboard } from "@/hooks/useParceirosDashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ParceirosHome() {
  const { data: metrics, isLoading } = useParceirosDashboard();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            Dashboard de Parceiros
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gestão de autorizados e representantes
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Ativos</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.totalAtivos || 0}
            </div>
            <p className="text-xs text-muted-foreground">parceiros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Novos no Mês</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.novosNoMes || 0}
            </div>
            <p className="text-xs text-muted-foreground">adições</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Representantes</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.representantesAtivos || 0}
            </div>
            <p className="text-xs text-muted-foreground">ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Licenciados</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.licenciadosAtivos || 0}
            </div>
            <p className="text-xs text-muted-foreground">ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Estado */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Top 5 Estados</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="h-[200px] sm:h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.autorizadosPorRegiao || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="estado" 
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" name="Parceiros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ranking de Performance */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Ranking de Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {metrics?.rankingPerformance.slice(0, 5).map((parceiro, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-3">
                <div className="font-bold text-lg sm:text-xl text-muted-foreground w-6 sm:w-8">
                  {index + 1}º
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium truncate">{parceiro.nome}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm sm:text-base font-bold">{parceiro.nota}</span>
                </div>
              </div>
            ))}
            {(!metrics?.rankingPerformance || metrics.rankingPerformance.length === 0) && (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma avaliação recente
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
