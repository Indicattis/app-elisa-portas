import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSalesData, useSellersRanking, useDashboardRealtime, useWhatsAppRoulette } from '@/hooks/useDashboardData';
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrcamentoStats } from "@/components/orcamentos/OrcamentoStats";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Target, DollarSign } from "lucide-react";
interface VendedorRanking {
  nome: string;
  total_vendas: number;
  posicao: number;
  foto_perfil_url?: string;
}
export default function Dashboard() {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Use React Query hooks for data fetching
  const {
    data: vendasData = [],
    isLoading: loadingVendas
  } = useSalesData();
  const {
    data: vendedores = [],
    isLoading: loadingVendedores
  } = useSellersRanking();
  const {
    data: whatsappStats = [],
    isLoading: loadingWhatsapp
  } = useWhatsAppRoulette();
  const {
    orcamentos
  } = useOrcamentos();

  // Setup realtime updates
  useDashboardRealtime();
  const loading = loadingVendas || loadingVendedores || loadingWhatsapp;
  const today = new Date();
  const chartConfig = {
    vendas: {
      label: "Vendas",
      color: "hsl(var(--primary))"
    },
    meta: {
      label: "Meta",
      color: "hsl(var(--muted-foreground))"
    }
  };

  // Setup autoplay effect
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (!isHovering) {
        api.scrollNext();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [api, isHovering]);

  // Setup event listeners for carousel
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);
  const handleDotClick = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  }, [api]);
  const totalVendasMes = useMemo(() => {
    return vendasData.reduce((sum, venda) => sum + venda.valor, 0);
  }, [vendasData]);
  const metaMensal = 500000; // Meta fictícia de R$ 500.000

  // Dados para gráfico de vendas por dia
  const vendasPorDia = vendasData?.map(item => ({
    data: new Date(item.data).getDate().toString(),
    vendas: item.valor,
    meta: metaMensal / 30 // Meta diária
  })) || [];
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const getVendedorCategory = (valor: number) => {
    if (valor >= 1500000) return {
      name: 'Orion',
      color: 'from-slate-300 to-slate-100',
      border: 'border-slate-300'
    };
    if (valor >= 1000000) return {
      name: 'Ômega',
      color: 'from-red-400 to-red-300',
      border: 'border-red-400'
    };
    if (valor >= 800000) return {
      name: 'Omni',
      color: 'from-purple-400 to-purple-300',
      border: 'border-purple-400'
    };
    if (valor >= 600000) return {
      name: 'Gama',
      color: 'from-emerald-400 to-emerald-300',
      border: 'border-emerald-400'
    };
    if (valor >= 500000) return {
      name: 'Alfa',
      color: 'from-yellow-400 to-yellow-300',
      border: 'border-yellow-400'
    };
    if (valor >= 400000) return {
      name: 'Beta',
      color: 'from-gray-400 to-gray-300',
      border: 'border-gray-400'
    };
    if (valor >= 300000) return {
      name: 'Zeta',
      color: 'from-amber-600 to-amber-500',
      border: 'border-amber-600'
    };
    return {
      name: 'Iniciante',
      color: 'from-slate-500 to-slate-400',
      border: 'border-slate-500'
    };
  };
  const getAllCategories = () => [{
    name: 'Iniciante',
    minValue: 0,
    maxValue: 300000,
    color: 'from-slate-500 to-slate-400',
    border: 'border-slate-500'
  }, {
    name: 'Zeta',
    minValue: 300000,
    maxValue: 400000,
    color: 'from-amber-600 to-amber-500',
    border: 'border-amber-600'
  }, {
    name: 'Beta',
    minValue: 400000,
    maxValue: 500000,
    color: 'from-gray-400 to-gray-300',
    border: 'border-gray-400'
  }, {
    name: 'Alfa',
    minValue: 500000,
    maxValue: 600000,
    color: 'from-yellow-400 to-yellow-300',
    border: 'border-yellow-400'
  }, {
    name: 'Gama',
    minValue: 600000,
    maxValue: 800000,
    color: 'from-emerald-400 to-emerald-300',
    border: 'border-emerald-400'
  }, {
    name: 'Omni',
    minValue: 800000,
    maxValue: 1000000,
    color: 'from-purple-400 to-purple-300',
    border: 'border-purple-400'
  }, {
    name: 'Ômega',
    minValue: 1000000,
    maxValue: 1500000,
    color: 'from-red-400 to-red-300',
    border: 'border-red-400'
  }, {
    name: 'Orion',
    minValue: 1500000,
    maxValue: Infinity,
    color: 'from-slate-300 to-slate-100',
    border: 'border-slate-300'
  }];
  return <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVendasMes)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta do Mês</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalVendasMes / metaMensal * 100).toFixed(1)}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{
              width: `${Math.min(totalVendasMes / metaMensal * 100, 100)}%`
            }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orcamentos?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {orcamentos?.filter(o => o.status === 'pendente').length || 0} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Dia (Mês Atual)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="vendas" stroke="var(--color-vendas)" strokeWidth={2} dot={{
                fill: "var(--color-vendas)"
              }} />
                <Line type="monotone" dataKey="meta" stroke="var(--color-meta)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Estatísticas detalhadas */}
      

      {/* Dashboard TV Original */}
      
    </div>;
}