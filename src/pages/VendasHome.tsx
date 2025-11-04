import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendasMesAtual, useVendasSemanaAtual, useRankingVendedoresDia } from "@/hooks/useVendasDashboard";
import { useSalesData, useSellersRanking } from "@/hooks/useDashboardData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export default function VendasHome() {
  const {
    data: vendasMes
  } = useVendasMesAtual();
  const {
    data: vendasDiarias
  } = useSalesData();
  const {
    data: ranking
  } = useSellersRanking();
  const ticketMedio = vendasMes && vendasMes.quantidade > 0 ? vendasMes.total / vendasMes.quantidade : 0;
  const chartData = vendasDiarias?.map(v => ({
    data: format(new Date(v.data), 'dd/MM', {
      locale: ptBR
    }),
    valor: v.valor
  })) || [];
  return <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            Dashboard de Vendas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visão geral do desempenho comercial
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Faturamento do Mês</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              R$ {vendasMes?.total.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total do mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Quantidade de Vendas</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {vendasMes?.quantidade || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas realizadas no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              R$ {ticketMedio.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              Média por venda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      

      {/* Top Vendedores */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Ranking de vendas do mês</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {ranking?.slice(0, 5).map((vendedor, index) => <div key={index} className="flex items-center gap-2 sm:gap-3">
                <div className="font-bold text-lg sm:text-xl text-muted-foreground w-6 sm:w-8">
                  {vendedor.posicao}º
                </div>
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={vendedor.foto_perfil_url} />
                  <AvatarFallback>{vendedor.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium truncate">{vendedor.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {vendedor.numero_vendas} vendas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold">
                    R$ {vendedor.total_vendas.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                })}
                  </p>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}