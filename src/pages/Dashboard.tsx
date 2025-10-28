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
import { TrendingUp, Target, DollarSign, Trophy, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      <div className="w-full">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento atual do mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVendasMes)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% vs mês anterior
            </p>
          </CardContent>
        </Card>

        

        
      </div>

      {/* Ranking de Vendas */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking de Vendas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVendedores ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : vendedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma venda registrada este mês</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendedores.map((vendedor) => {
                const category = getVendedorCategory(vendedor.total_vendas);
                return (
                  <div
                    key={vendedor.nome}
                    className={`relative p-4 rounded-lg border-2 bg-gradient-to-br ${category.color} ${category.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                          <AvatarImage src={vendedor.foto_perfil_url} alt={vendedor.nome} />
                          <AvatarFallback className="bg-background text-foreground">
                            {vendedor.nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {vendedor.posicao <= 3 && (
                          <div className="absolute -top-1 -right-1">
                            <Medal className={`h-5 w-5 ${
                              vendedor.posicao === 1 ? 'text-yellow-500' :
                              vendedor.posicao === 2 ? 'text-gray-400' :
                              'text-amber-700'
                            }`} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {vendedor.nome}
                          </h4>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            #{vendedor.posicao}
                          </Badge>
                        </div>
                        
                        <Badge variant="outline" className="mb-2 text-xs">
                          {category.name}
                        </Badge>
                        
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(vendedor.total_vendas)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de vendas */}
      

      {/* Estatísticas detalhadas */}
      

      {/* Dashboard TV Original */}
      
    </div>;
}