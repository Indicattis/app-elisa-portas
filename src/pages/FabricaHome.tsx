import { Factory, Package, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFabricaDashboard } from "@/hooks/useFabricaDashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FabricaHome() {
  const { data: metrics, isLoading } = useFabricaDashboard();

  const ordensData = [
    { etapa: 'Perfiladeira', quantidade: metrics?.ordensPerfiladeira || 0 },
    { etapa: 'Soldagem', quantidade: metrics?.ordensSoldagem || 0 },
    { etapa: 'Separação', quantidade: metrics?.ordensSeparacao || 0 },
    { etapa: 'Pintura', quantidade: metrics?.ordensPintura || 0 },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
          <Factory className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            Dashboard da Fábrica
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visão geral da produção
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Em Produção</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.pedidosEmProducao || 0}
            </div>
            <p className="text-xs text-muted-foreground">pedidos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Concluídos no Mês</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.pedidosConcluidos || 0}
            </div>
            <p className="text-xs text-muted-foreground">pedidos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.tempoMedioProducao.toFixed(1) || '0.0'} dias
            </div>
            <p className="text-xs text-muted-foreground">por pedido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {metrics?.eficienciaProducao.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">taxa de conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Ordens por Etapa */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Ordens por Etapa</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="h-[200px] sm:h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordensData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="etapa" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="quantidade" fill="hsl(var(--primary))" name="Ordens em Andamento" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
