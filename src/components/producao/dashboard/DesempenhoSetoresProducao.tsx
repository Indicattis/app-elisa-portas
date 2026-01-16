import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Cog, Flame, Package, Paintbrush, Truck } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDesempenhoProducaoGeral } from "@/hooks/useDesempenhoProducaoGeral";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { DateRange } from "react-day-picker";

const SETORES = [
  { key: "portas_perfiladas", label: "Perfiladas", icon: Cog, color: "hsl(210, 80%, 55%)" },
  { key: "portas_soldadas", label: "Soldadas", icon: Flame, color: "hsl(25, 90%, 55%)" },
  { key: "portas_separadas", label: "Separadas", icon: Package, color: "hsl(145, 65%, 45%)" },
  { key: "portas_pintadas", label: "Pintadas", icon: Paintbrush, color: "hsl(330, 70%, 55%)" },
  { key: "portas_carregadas", label: "Carregadas", icon: Truck, color: "hsl(270, 60%, 55%)" },
];

const chartConfig = {
  portas_perfiladas: { label: "Perfiladas", color: "hsl(210, 80%, 55%)" },
  portas_soldadas: { label: "Soldadas", color: "hsl(25, 90%, 55%)" },
  portas_separadas: { label: "Separadas", color: "hsl(145, 65%, 45%)" },
  portas_pintadas: { label: "Pintadas", color: "hsl(330, 70%, 55%)" },
  portas_carregadas: { label: "Carregadas", color: "hsl(270, 60%, 55%)" },
};

export function DesempenhoSetoresProducao() {
  const hoje = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfWeek(hoje, { weekStartsOn: 0 }),
    to: endOfWeek(hoje, { weekStartsOn: 0 }),
  });

  const dataInicio = dateRange.from || startOfWeek(hoje, { weekStartsOn: 0 });
  const dataFim = dateRange.to || endOfWeek(hoje, { weekStartsOn: 0 });

  const { data: desempenho = [], isLoading } = useDesempenhoProducaoGeral(dataInicio, dataFim);

  const totais = useMemo(() => {
    return SETORES.reduce((acc, setor) => {
      acc[setor.key] = desempenho.reduce((sum, d) => sum + (Number(d[setor.key as keyof typeof d]) || 0), 0);
      return acc;
    }, {} as Record<string, number>);
  }, [desempenho]);

  const chartData = useMemo(() => {
    return desempenho.map((d) => ({
      ...d,
      dataFormatada: format(new Date(d.data), "dd/MM", { locale: ptBR }),
    }));
  }, [desempenho]);

  const handlePresetClick = (preset: "esta_semana" | "semana_passada" | "este_mes") => {
    switch (preset) {
      case "esta_semana":
        setDateRange({
          from: startOfWeek(hoje, { weekStartsOn: 0 }),
          to: endOfWeek(hoje, { weekStartsOn: 0 }),
        });
        break;
      case "semana_passada":
        const semanaPassada = subWeeks(hoje, 1);
        setDateRange({
          from: startOfWeek(semanaPassada, { weekStartsOn: 0 }),
          to: endOfWeek(semanaPassada, { weekStartsOn: 0 }),
        });
        break;
      case "este_mes":
        setDateRange({
          from: startOfMonth(hoje),
          to: endOfMonth(hoje),
        });
        break;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            Desempenho por Setor
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handlePresetClick("esta_semana")}
            >
              Esta Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handlePresetClick("semana_passada")}
            >
              Semana Passada
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handlePresetClick("este_mes")}
            >
              Este Mês
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                    : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => range && setDateRange(range)}
                  locale={ptBR}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cards de totais */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SETORES.map((setor) => {
            const Icon = setor.icon;
            return (
              <div
                key={setor.key}
                className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/30"
              >
                <div
                  className="p-1.5 rounded-md"
                  style={{ backgroundColor: `${setor.color}20` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: setor.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">
                    {setor.label}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-5 w-10" />
                  ) : (
                    <p className="text-lg font-bold">{totais[setor.key]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráfico de linhas */}
        <div className="h-[280px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhum dado encontrado para o período selecionado
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="dataFormatada"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    iconSize={10}
                  />
                  {SETORES.map((setor) => (
                    <Line
                      key={setor.key}
                      type="monotone"
                      dataKey={setor.key}
                      name={setor.label}
                      stroke={setor.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: setor.color }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
