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

  
  const { orcamentos } = useOrcamentos();

  // Setup realtime updates
  useDashboardRealtime();
  const loading = loadingVendas || loadingVendedores || loadingWhatsapp;
  const today = new Date();

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
    meta: metaMensal / 30, // Meta diária
  })) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold">{((totalVendasMes / metaMensal) * 100).toFixed(1)}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalVendasMes / metaMensal) * 100, 100)}%` }}
              />
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
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="var(--color-vendas)" 
                  strokeWidth={2}
                  dot={{ fill: "var(--color-vendas)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="var(--color-meta)" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Estatísticas detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orcamentos && <OrcamentoStats orcamentos={orcamentos} />}
      </div>

      {/* Dashboard TV Original */}
      <div className="h-[90vh] relative overflow-hidden w-full">
        <Carousel setApi={setApi} className="w-full h-full" opts={{
      align: "center",
      loop: true
    }} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <CarouselContent className="h-full w-full max-w-[95vw]">
          {/* Slide 1: Faturamento */}
          <CarouselItem className="h-full w-full flex items-center justify-center">
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 w-full mt-40">
              {/* Logo */}
              <div>
                <img src="/lovable-uploads/31df71a1-a366-49f8-81f7-acee745d5a32.png" alt="Grupo Elisa" className="h-20 w-auto" />
              </div>
              
              {/* Título Faturamento */}
              <h1 className="font-anton text-7xl">FATURAMENTO</h1>
              
              {/* Contador das vendas do mês */}
              <div className="w-full flex justify-center">
                <div className="bg-gradient-to-r from-[#6d5e32] to-[#f0e0aa] shadow-2xl border-[3px] border-[#edd99e] p-[10px] w-full flex items-center justify-center" style={{
                height: '250px'
              }}>
                <div className="text-center">
                  {loading ? <div className="text-7xl font-inter font-medium text-white">
                      Carregando...
                    </div> : <div className="font-inter font-bold text-white" style={{
                    fontSize: '12rem'
                  }}>
                      {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalVendasMes)}
                    </div>}
                </div>
                </div>
              </div>

              {/* Data e hora atual */}
              <div className="text-center text-muted-foreground space-y-3">
                <div className="text-xl font-semibold uppercase ">
                  {format(today, "MMMM 'de' yyyy", {
                  locale: ptBR
                })}
                </div>
                
                {/* Linha horizontal */}
                <div className="w-32 h-0.5 bg-muted-foreground mx-auto"></div>
                
                <div className="text-lg">
                  {format(today, "dd/MM/yyyy - HH:mm", {
                  locale: ptBR
                })}
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 2: Ranking */}
          <CarouselItem className="h-full w-full flex items-center justify-center">
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 w-full mt-40">
              {/* Container principal com ranking */}
              <div className="w-full max-w-4xl">
                {/* Lista de ranking */}
                <div className="space-y-4">
                  {vendedores.slice(0, 10).map(vendedor => {
                  const category = getVendedorCategory(vendedor.total_vendas);
                  return <div key={`${vendedor.nome}-${vendedor.posicao}`} className="h-full flex items-center justify-between p-6 rounded-lg bg-card border border-border shadow-lg">
                        <div className="flex items-center space-x-4">
                           {/* Foto do vendedor com borda colorida */}
                          <div className="relative">
                            {vendedor.foto_perfil_url ? <img src={vendedor.foto_perfil_url} alt={`Foto de ${vendedor.nome}`} className={`w-32 h-32 rounded-full object-cover border-4 ${category.border} shadow-md`} onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                        }} /> : null}
                            <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-3xl shadow-md border-4 ${category.border} ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                              {vendedor.nome.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="text-3xl font-bold text-foreground">
                              {vendedor.nome}
                            </h3>
                            <div className={`inline-block px-4 py-2 rounded-full text-lg font-semibold text-white bg-gradient-to-r ${category.color}`}>
                              Vendedor {category.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-6xl font-bold text-foreground">
                            {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(vendedor.total_vendas)}
                          </div>
                          <div className="text-lg text-muted-foreground mt-2">
                            {whatsappStats.find(w => w.nome === vendedor.nome)?.total_clicks || 0} cliques WhatsApp
                          </div>
                        </div>
                      </div>;
                })}
                  
                   {vendedores.length === 0 && <div className="text-center py-12">
                      <p className="text-xl text-muted-foreground">Nenhuma venda registrada este mês</p>
                    </div>}
                </div>
              </div>
            </div>
          </CarouselItem>

          {/* Slide 3: Metas Individuais Chart */}
          <CarouselItem className="h-full w-full flex items-center justify-center">
            <div className="h-full flex flex-col items-center justify-center p-6 mt-[300px]">
              {/* Chart Layout */}
              <div className="w-full max-w-7xl mt-12">
                <div className="flex justify-center items-end gap-12 h-96 w-full">
                  {getAllCategories().map((category, index) => {
                  const vendedoresNaCategoria = vendedores.filter(v => {
                    if (category.name === 'Orion') return v.total_vendas >= category.minValue;
                    return v.total_vendas >= category.minValue && v.total_vendas < category.maxValue;
                  });
                  return <div key={category.name} className="flex flex-col items-center">
                        {/* Fotos dos vendedores */}
                        <div className="flex flex-col gap-2 mb-4 h-64 justify-end">
                          {vendedoresNaCategoria.map((vendedor, vendedorIndex) => <div key={vendedor.nome} className="flex flex-col items-center">
                              <div className="relative">
                                {vendedor.foto_perfil_url ? <img src={vendedor.foto_perfil_url} alt={`Foto de ${vendedor.nome}`} className={`w-32 h-32 rounded-full object-cover border-3 ${category.border} shadow-md`} onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                          }} /> : null}
                                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white font-bold text-2xl shadow-md border-3 ${category.border} ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                                  {vendedor.nome.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            </div>)}
                        </div>
                        
                        {/* Imagem da categoria */}
                        <div className="w-[180px] h-[180px] flex items-center justify-center">
                          {category.name === 'Orion' && <img src="/lovable-uploads/1.png" alt="Vendedor Orion" className="w-[180px] h-[180px] filter brightness-0 saturate-100 invert-[15%] sepia-[100%] saturate-[5000%] hue-rotate-[350deg] brightness-[95%] contrast-[100%]" />}
                           {category.name === 'Ômega' && <img src="/lovable-uploads/2.png" alt="Vendedor Ômega" className="w-[180px] h-[180px]" />}
                           {category.name === 'Omni' && <img src="/lovable-uploads/3.png" alt="Vendedor Omni" className="w-[180px] h-[180px]" />}
                           {category.name === 'Gama' && <img src="/lovable-uploads/7.png" alt="Vendedor Gama" className="w-[180px] h-[180px]" />}
                           {category.name === 'Alfa' && <img src="/lovable-uploads/6.png" alt="Vendedor Alfa" className="w-[180px] h-[180px]" />}
                           {category.name === 'Beta' && <img src="/lovable-uploads/5.png" alt="Vendedor Beta" className="w-[180px] h-[180px]" />}
                           {category.name === 'Zeta' && <img src="/lovable-uploads/4.png" alt="Vendedor Zeta" className="w-[180px] h-[180px]" />}
                           {category.name === 'Iniciante' && <div className="w-[180px] h-[180px] bg-gradient-to-r from-red-500 to-red-400 rounded-full flex items-center justify-center">
                               <div className="w-20 h-20 bg-white/20 rounded-full"></div>
                             </div>}
                        </div>
                        
                      </div>;
                })}
                </div>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>
        
        {/* Navigation arrows with responsive positioning */}
        <CarouselPrevious className="left-2 sm:-left-12" />
        <CarouselNext className="right-2 sm:-right-12" />
      </Carousel>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[0, 1, 2].map(index => <button key={index} onClick={() => handleDotClick(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${selectedIndex === index ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white/70'}`} />)}
      </div>
      </div>
    </div>
  );
}