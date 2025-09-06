import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSalesData, useSellersRanking } from "@/hooks/useDashboardData";
import { useLeads } from "@/hooks/useLeads";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { LeadStats } from "@/components/LeadStats";
import { OrcamentoStats } from "@/components/orcamentos/OrcamentoStats";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, DollarSign, Users, FileText, Target } from "lucide-react";

const chartConfig = {
  vendas: {
    label: "Vendas",
    color: "hsl(var(--primary))",
  },
  meta: {
    label: "Meta",
    color: "hsl(var(--muted-foreground))",
  },
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
];

export default function TvDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: salesData, isLoading: salesLoading } = useSalesData();
  const { data: sellersData, isLoading: sellersLoading } = useSellersRanking();
  const { leads, loading: leadsLoading } = useLeads();
  const { orcamentos, loading: orcamentosLoading } = useOrcamentos();

  // Atualizar horário a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calcular métricas
  const totalVendasMes = salesData?.reduce((sum, item) => sum + item.valor, 0) || 0;
  const metaMensal = 500000; // Meta fictícia de R$ 500.000
  const progressoMeta = (totalVendasMes / metaMensal) * 100;

  // Dados para gráfico de vendas por dia
  const vendasPorDia = salesData?.map(item => ({
    data: new Date(item.data).getDate().toString(),
    vendas: item.valor,
    meta: metaMensal / 30, // Meta diária
  })) || [];

  // Dados para gráfico de leads por tag
  const leadsGrouped = leads?.reduce((acc, lead) => {
    const status = lead.tag_id ? `Tag ${lead.tag_id}` : 'Sem etiqueta';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const leadsPieData = Object.entries(leadsGrouped).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Dados para gráfico de orçamentos por valor
  const orcamentosRanges = [
    { range: "0-20k", min: 0, max: 20000, count: 0 },
    { range: "20k-50k", min: 20000, max: 50000, count: 0 },
    { range: "50k-100k", min: 50000, max: 100000, count: 0 },
    { range: "100k+", min: 100000, max: Infinity, count: 0 },
  ];

  orcamentos?.forEach(orc => {
    const valor = orc.valor_total || 0;
    const range = orcamentosRanges.find(r => valor >= r.min && valor < r.max);
    if (range) range.count++;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (salesLoading || sellersLoading || leadsLoading || orcamentosLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header com tempo real */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard TV</h1>
          <p className="text-xl text-muted-foreground mt-2">{formatDate(currentTime)}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-mono font-bold text-primary">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVendasMes)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalVendasMes - (metaMensal * 0.8))} vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta do Mês</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressoMeta.toFixed(1)}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressoMeta, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orcamentos?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {orcamentos?.filter(o => o.status === 'pendente').length || 0} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="vendas" fill="var(--color-vendas)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Leads por tag */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Etiqueta</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de vendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vendedores do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellersData?.slice(0, 6).map((seller, index) => (
              <div key={seller.nome} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {index + 1}º
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{seller.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(seller.total_vendas)}
                  </p>
                </div>
                {index === 0 && <TrendingUp className="h-5 w-5 text-primary" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {leads && <LeadStats leads={leads} />}
        {orcamentos && <OrcamentoStats orcamentos={orcamentos} />}
      </div>

      {/* Orçamentos por faixa de valor */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos por Faixa de Valor</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orcamentosRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-vendas)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}