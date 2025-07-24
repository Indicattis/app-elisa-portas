
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Target, ChevronDown } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  faturamentoMes: number;
  metaMinima: number;
  metaIdeal: number;
  superMeta: number;
}

interface MonthData {
  mes: string;
  faturamento: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    faturamentoMes: 0,
    metaMinima: 1000000, // R$ 1.000.000,00
    metaIdeal: 1500000,  // R$ 1.500.000,00
    superMeta: 2000000,  // R$ 2.000.000,00
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [chartData, setChartData] = useState<MonthData[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchChartData();
  }, [selectedMonth]);

  const fetchDashboardStats = async () => {
    try {
      // Buscar faturamento do mês selecionado
      const startOfSelectedMonth = startOfMonth(selectedMonth);
      const endOfSelectedMonth = endOfMonth(selectedMonth);

      const { data: vendasMes, error: vendasMesError } = await supabase
        .from("vendas")
        .select("valor_venda")
        .gte("data_venda", startOfSelectedMonth.toISOString())
        .lte("data_venda", endOfSelectedMonth.toISOString());

      if (vendasMesError) throw vendasMesError;

      const faturamentoMes = vendasMes?.reduce((acc, venda) => acc + (venda.valor_venda || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        faturamentoMes,
      }));
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const fetchChartData = async () => {
    try {
      const currentYear = selectedMonth.getFullYear();
      const chartDataPromises = [];

      // Buscar dados para todos os 12 meses do ano
      for (let month = 0; month < 12; month++) {
        const startOfMonthDate = new Date(currentYear, month, 1);
        const endOfMonthDate = new Date(currentYear, month + 1, 0);

        chartDataPromises.push(
          supabase
            .from("vendas")
            .select("valor_venda")
            .gte("data_venda", startOfMonthDate.toISOString())
            .lte("data_venda", endOfMonthDate.toISOString())
            .then(({ data, error }) => {
              if (error) throw error;
              const total = data?.reduce((acc, venda) => acc + (venda.valor_venda || 0), 0) || 0;
              return {
                mes: format(startOfMonthDate, "MMM", { locale: ptBR }),
                faturamento: total,
              };
            })
        );
      }

      const results = await Promise.all(chartDataPromises);
      setChartData(results);
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico:", error);
    }
  };

  const progressoMetaMinima = (stats.faturamentoMes / stats.metaMinima) * 100;
  const progressoMetaIdeal = (stats.faturamentoMes / stats.metaIdeal) * 100;
  const progressoSuperMeta = (stats.faturamentoMes / stats.superMeta) * 100;

  const getMetaStatus = () => {
    if (stats.faturamentoMes >= stats.superMeta) return { label: "🚀 Super Meta Atingida!", color: "text-purple-600" };
    if (stats.faturamentoMes >= stats.metaIdeal) return { label: "🎯 Meta Ideal Atingida!", color: "text-blue-600" };
    if (stats.faturamentoMes >= stats.metaMinima) return { label: "✅ Meta Mínima Atingida!", color: "text-green-600" };
    return { label: "📈 Trabalhando para a meta", color: "text-orange-600" };
  };

  const metaStatus = getMetaStatus();

  // Gerar opções de meses para o select
  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      options.push(date);
    }
    return options;
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe o faturamento e progresso das metas
          </p>
        </div>
        <Select value={format(selectedMonth, "yyyy-MM")} onValueChange={(value) => setSelectedMonth(new Date(value + "-01"))}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getMonthOptions().map((date) => (
              <SelectItem key={format(date, "yyyy-MM")} value={format(date, "yyyy-MM")}>
                {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Barra de Progresso Grande */}
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            Progresso das Metas - {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
          <CardDescription className={`text-lg font-semibold ${metaStatus.color}`}>
            {metaStatus.label}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Faturamento Atual</span>
              <span className="text-2xl font-bold text-primary">
                R$ {stats.faturamentoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {/* Barra de progresso principal com múltiplas metas */}
            <div className="relative">
              <div className="h-8 bg-muted rounded-full overflow-hidden">
                {/* Meta Mínima */}
                <div 
                  className="h-full bg-green-500 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(progressoMetaMinima, 100)}%` }}
                />
                {/* Meta Ideal */}
                {progressoMetaMinima >= 100 && (
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000 ease-out delay-300"
                    style={{ 
                      width: `${Math.min(progressoMetaIdeal - 100, 50)}%`,
                      marginTop: '-2rem'
                    }}
                  />
                )}
                {/* Super Meta */}
                {progressoMetaIdeal >= 100 && (
                  <div 
                    className="h-full bg-purple-500 transition-all duration-1000 ease-out delay-600"
                    style={{ 
                      width: `${Math.min(progressoSuperMeta - 150, 33.33)}%`,
                      marginTop: '-2rem'
                    }}
                  />
                )}
              </div>
              
              {/* Marcadores das metas */}
              <div className="flex justify-between mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Meta Mínima: R$ 1.000.000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Meta Ideal: R$ 1.500.000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Super Meta: R$ 2.000.000</span>
                </div>
              </div>
            </div>

            {/* Percentuais das metas */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{progressoMetaMinima.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Meta Mínima</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{progressoMetaIdeal.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Meta Ideal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{progressoSuperMeta.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Super Meta</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento Anual</CardTitle>
          <CardDescription>
            Faturamento de todos os meses do ano de {selectedMonth.getFullYear()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    "Faturamento"
                  ]}
                />
                <Bar dataKey="faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
