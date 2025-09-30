import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSalesData, useSellersRanking, useDashboardRealtime, useWhatsAppRoulette, useAutorizadosPorAtendente } from '@/hooks/useDashboardData';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
interface VendedorRanking {
  nome: string;
  total_vendas: number;
  numero_vendas: number;
  posicao: number;
  foto_perfil_url?: string;
}
export default function TvDashboard() {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);

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
    data: autorizadosStats = {},
    isLoading: loadingAutorizados
  } = useAutorizadosPorAtendente();

  // Hook for quarterly sales data (July, August, September)
  const {
    data: vendasTrimestre = [],
    isLoading: loadingVendasTrimestre
  } = useQuery({
    queryKey: ['vendas-trimestre'],
    queryFn: async () => {
      const ano = new Date().getFullYear();
      const inicioJulho = new Date(ano, 6, 1); // Julho é mês 6 (0-indexed)
      const fimSetembro = new Date(ano, 9, 0); // Último dia de setembro

      const {
        data,
        error
      } = await supabase.from('contador_vendas_dias').select('data, valor').gte('data', format(inicioJulho, 'yyyy-MM-dd')).lte('data', format(fimSetembro, 'yyyy-MM-dd'));
      if (error) {
        console.error('Erro ao buscar vendas do trimestre:', error);
        throw error;
      }
      return data || [];
    },
    refetchInterval: 120000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Setup realtime updates
  useDashboardRealtime();
  const loading = loadingVendas || loadingVendedores || loadingWhatsapp || loadingAutorizados || loadingVendasTrimestre;
  const today = new Date();

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

  // Setup progress bar effect
  useEffect(() => {
    if (!api || isHovering) return;
    
    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          return 0; // Reset when reaching 100%
        }
        return prevProgress + 1; // Increment by 1% every 100ms (10s total)
      });
    }, 100); // Update every 100ms

    return () => clearInterval(progressInterval);
  }, [api, isHovering, selectedIndex]);

  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0);
  }, [selectedIndex]);

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
  const totalVendasTrimestre = useMemo(() => {
    return vendasTrimestre.reduce((sum, venda) => sum + Number(venda.valor), 0);
  }, [vendasTrimestre]);
  const metaTrimestre = 3000000; // 3 milhões
  const faltaParaMeta = Math.max(0, metaTrimestre - totalVendasTrimestre);
  const progressoMeta = Math.min(100, totalVendasTrimestre / metaTrimestre * 100);
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
  return <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Carousel setApi={setApi} className="w-full h-full" opts={{
      align: "center",
      loop: true
    }} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <CarouselContent className="h-[80vh] w-full max-w-[95vw]">
          {/* Slide 1: Faturamento */}
          <CarouselItem className="h-full w-full flex items-center justify-center">
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-6 w-full">
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

              {/* Meta do Trimestre e Barra de Progresso */}
              <div className="w-full max-w-4xl space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">META GÊNESIS</h2>
                  <div className="text-lg text-muted-foreground">
                    Faturamento Acumulado: {' '}
                    <span className="text-[#f0e0aa] font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalVendasTrimestre)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-transparent ">
                  <div className="space-y-3">
                    <Progress value={progressoMeta} className="h-6 bg-black/30 [&>div]:bg-gradient-to-r [&>div]:from-[#6d5e32] [&>div]:to-[#f0e0aa]" />
                    <div className="flex justify-between text-white font-semibold">
                      <span>{progressoMeta.toFixed(1)}% da meta</span>
                      <span className="text-red-400 text-2xl font-bold">
                        Faltam: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(faltaParaMeta)}
                      </span>
                    </div>
                    <div className="text-center text-white/90 text-sm">
                      Meta: R$ 3.000.000
                    </div>
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
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-6 w-full">
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
                          <div className="text-lg text-muted-foreground mt-2 space-y-1">
                            <div>{vendedor.numero_vendas} vendas realizadas</div>
                            <div>{whatsappStats.find(w => w.nome === vendedor.nome)?.total_clicks || 0} leads WhatsApp</div>
                            <div>{autorizadosStats[vendedor.nome] || 0} autorizados</div>
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
            <div className="h-full flex flex-col items-center justify-center p-6 mt-8">
              {/* Chart Layout */}
              <div className="w-full max-w-7xl">
                <div className="flex justify-center items-end gap-8 h-80 w-full">
                  {getAllCategories().map((category, index) => {
                  const vendedoresNaCategoria = vendedores.filter(v => {
                    if (category.name === 'Orion') return v.total_vendas >= category.minValue;
                    return v.total_vendas >= category.minValue && v.total_vendas < category.maxValue;
                  });
                  return <div key={category.name} className="flex flex-col items-center">
                        {/* Fotos dos vendedores */}
                        <div className="flex flex-col gap-2 mb-4 h-48 justify-end">
                          {vendedoresNaCategoria.map((vendedor, vendedorIndex) => <div key={vendedor.nome} className="flex flex-col items-center">
                              <div className="relative">
                                {vendedor.foto_perfil_url ? <img src={vendedor.foto_perfil_url} alt={`Foto de ${vendedor.nome}`} className={`w-24 h-24 rounded-full object-cover border-3 ${category.border} shadow-md`} onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                          }} /> : null}
                                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white font-bold text-lg shadow-md border-3 ${category.border} ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                                  {vendedor.nome.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            </div>)}
                        </div>
                        
                        {/* Imagem da categoria */}
                        <div className="w-[120px] h-[120px] flex items-center justify-center">
                          {category.name === 'Orion' && <img src="/lovable-uploads/1.png" alt="Vendedor Orion" className="w-[120px] h-[120px] filter brightness-0 saturate-100 invert-[15%] sepia-[100%] saturate-[5000%] hue-rotate-[350deg] brightness-[95%] contrast-[100%]" />}
                           {category.name === 'Ômega' && <img src="/lovable-uploads/2.png" alt="Vendedor Ômega" className="w-[120px] h-[120px]" />}
                           {category.name === 'Omni' && <img src="/lovable-uploads/3.png" alt="Vendedor Omni" className="w-[120px] h-[120px]" />}
                           {category.name === 'Gama' && <img src="/lovable-uploads/7.png" alt="Vendedor Gama" className="w-[120px] h-[120px]" />}
                           {category.name === 'Alfa' && <img src="/lovable-uploads/6.png" alt="Vendedor Alfa" className="w-[120px] h-[120px]" />}
                           {category.name === 'Beta' && <img src="/lovable-uploads/5.png" alt="Vendedor Beta" className="w-[120px] h-[120px]" />}
                           {category.name === 'Zeta' && <img src="/lovable-uploads/4.png" alt="Vendedor Zeta" className="w-[120px] h-[120px]" />}
                           {category.name === 'Iniciante' && <div className="w-[120px] h-[120px] bg-gradient-to-r from-red-500 to-red-400 rounded-full flex items-center justify-center">
                               <div className="w-16 h-16 bg-white/20 rounded-full"></div>
                             </div>}
                        </div>
                        
                        {/* Nome da categoria e valores das metas */}
                        <div className="text-center mt-4 space-y-2">
                          <h3 className={`text-lg font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
                            {category.name}
                          </h3>
                          <div className="text-sm text-white/80">
                            {category.name === 'Orion' ? (
                              <span>
                                ≥ {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(category.minValue)}
                              </span>
                            ) : (
                              <span>
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(category.minValue)} - {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(category.maxValue)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                      </div>;
                })}
                </div>
              </div>
            </div>
          </CarouselItem>
          {/* Slide 4: Meta Parceiros Autorizados */}
          <CarouselItem className="h-full w-full flex items-center justify-center">
            <div className="h-full flex flex-col items-center justify-start p-6 space-y-6 w-full">
              {/* Título */}
              <div className="text-center">
                <h1 className="font-anton text-6xl mb-2">META PARCEIROS</h1>
                <p className="text-2xl text-muted-foreground">100 autorizados por vendedor</p>
              </div>
              
              {/* Lista de vendedores com progresso */}
              <div className="w-full max-w-6xl space-y-4">
                {vendedores.slice(0, 8).map(vendedor => {
                  const autorizadosCount = autorizadosStats[vendedor.nome] || 0;
                  const progresso = Math.min(100, (autorizadosCount / 100) * 100);
                  
                  // Cor da barra baseada no progresso
                  const getBarColor = (progress: number) => {
                    if (progress >= 90) return 'bg-gradient-to-r from-green-500 to-green-400';
                    if (progress >= 70) return 'bg-gradient-to-r from-lime-500 to-lime-400';
                    if (progress >= 50) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
                    if (progress >= 30) return 'bg-gradient-to-r from-orange-500 to-orange-400';
                    return 'bg-gradient-to-r from-red-500 to-red-400';
                  };
                  
                  return (
                    <div key={vendedor.nome} className="bg-card/30 border border-border/50 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        {/* Foto do vendedor */}
                        <div className="relative flex-shrink-0">
                          {vendedor.foto_perfil_url ? (
                            <img 
                              src={vendedor.foto_perfil_url} 
                              alt={`Foto de ${vendedor.nome}`} 
                              className="w-16 h-16 rounded-full object-cover border-4 border-white/20 shadow-lg" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                              }} 
                            />
                          ) : null}
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white/20 ${vendedor.foto_perfil_url ? 'hidden' : ''}`}>
                            {vendedor.nome.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        {/* Informações e barra de progresso */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-bold text-white">{vendedor.nome}</h3>
                            <div className="text-right">
                              <div className="text-4xl font-bold text-white">
                                {autorizadosCount}
                              </div>
                              <div className="text-lg text-muted-foreground">
                                de 100
                              </div>
                            </div>
                          </div>
                          
                          {/* Barra de progresso grande */}
                          <div className="space-y-2">
                            <div className="w-full bg-black/30 rounded-full h-6 border border-white/10">
                              <div 
                                className={`h-full rounded-full ${getBarColor(progresso)} transition-all duration-1000 ease-in-out flex items-center justify-end pr-4`}
                                style={{ width: `${progresso}%` }}
                              >
                                <span className="text-white font-bold text-lg">
                                  {progresso.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>0</span>
                              <span>25</span>
                              <span>50</span>
                              <span>75</span>
                              <span>100</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>
        
        {/* Navigation arrows with responsive positioning */}
        <CarouselPrevious className="left-2 sm:-left-12" />
        <CarouselNext className="right-2 sm:-right-12" />
      </Carousel>
      
      {/* Progress Bar */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-80">
        <Progress 
          value={progress} 
          className="h-2 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80 [&>div]:transition-all [&>div]:duration-100" 
        />
      </div>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {[0, 1, 2, 3].map(index => <button key={index} onClick={() => handleDotClick(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${selectedIndex === index ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white/70'}`} />)}
      </div>
    </div>;
}