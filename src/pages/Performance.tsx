import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, Mouse, TrendingUp, Globe, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ShoppingCart, DollarSign, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSalesData, useWhatsAppRoulette } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS } from "@/types/permissions";
import type { DateRange } from "react-day-picker";

interface WhatsAppClick {
  id: string;
  atendente_nome: string;
  atendente_telefone: string | null;
  created_at: string;
  fbclid: string | null;
  gclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  traffic_channel: string | null;
  source: string | null;
  page_url: string | null;
  referrer: string | null;
  ip: string | null;
}

interface AtendenteStats {
  nome: string;
  total_clicks: number;
}

interface CanalStats {
  canal: string;
  total_clicks: number;
}

interface ReferrerStats {
  referrer: string;
  total_clicks: number;
}

interface VendedorCompleto {
  id: string;
  nome: string;
  foto_perfil_url: string | null;
  role: string;
  vendasCount: number;
}

interface CacCanalData {
  canal_id: string;
  canal_nome: string;
  investimento: number;
  faturamento: number;
  lucro: number;
  lucroLiquido: number;
  roi: number;
  cac: number;
  totalVendas: number;
  vendasFaturadas: number;
  vendasPendentes: number;
}

export default function Performance() {
  const [whatsAppClicks, setWhatsAppClicks] = useState<WhatsAppClick[]>([]);
  const [atendenteStats, setAtendenteStats] = useState<AtendenteStats[]>([]);
  const [canalStats, setCanalStats] = useState<CanalStats[]>([]);
  const [referrerStats, setReferrerStats] = useState<ReferrerStats[]>([]);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const today = new Date();

  // Estados para a nova seção de vendas
  const [vendasDateRange, setVendasDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [vendedorIndexPublicoAlvo, setVendedorIndexPublicoAlvo] = useState<number>(0);
  const [vendedorIndexCanalAquisicao, setVendedorIndexCanalAquisicao] = useState<number>(0);
  const [vendedorIndexEstado, setVendedorIndexEstado] = useState<number>(0);
  const [publicoAlvoData, setPublicoAlvoData] = useState<{name: string; value: number}[]>([]);
  const [canalAquisicaoData, setCanalAquisicaoData] = useState<{name: string; value: number}[]>([]);
  const [estadoData, setEstadoData] = useState<{name: string; value: number}[]>([]);
  const [vendedoresCompletos, setVendedoresCompletos] = useState<VendedorCompleto[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);

  // Estados para a seção de CAC
  const [cacMes, setCacMes] = useState<Date>(startOfMonth(new Date()));
  const [cacMesIndex, setCacMesIndex] = useState<number>(0);
  const [cacRegiao, setCacRegiao] = useState<string>("all");
  const [cacRegiaoIndex, setCacRegiaoIndex] = useState<number>(0);
  const [vendedorIndexCAC, setVendedorIndexCAC] = useState<number>(0);
  const [cacData, setCacData] = useState<CacCanalData[]>([]);
  const [loadingCAC, setLoadingCAC] = useState(false);
  const [cacMeses, setCacMeses] = useState<Date[]>([]);
  const [cacRegioes, setCacRegioes] = useState<string[]>(["all"]);

  // Use the corrected sales data hook
  const { data: salesData, isLoading: loadingSales } = useSalesData();
  const { data: whatsAppData } = useWhatsAppRoulette();

  useEffect(() => {
    fetchWhatsAppData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(() => {
      fetchWhatsAppData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchVendedores();
  }, [vendasDateRange]);

  useEffect(() => {
    fetchPublicoAlvoData();
  }, [vendasDateRange, vendedorIndexPublicoAlvo, vendedoresCompletos]);

  useEffect(() => {
    fetchCanalAquisicaoData();
  }, [vendasDateRange, vendedorIndexCanalAquisicao, vendedoresCompletos]);

  useEffect(() => {
    fetchEstadoData();
  }, [vendasDateRange, vendedorIndexEstado, vendedoresCompletos]);

  useEffect(() => {
    fetchCacData();
  }, [cacMes, cacRegiao, vendedorIndexCAC, vendedoresCompletos]);

  useEffect(() => {
    // Gerar lista de meses (últimos 12 meses)
    const meses: Date[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      meses.push(startOfMonth(date));
    }
    setCacMeses(meses);
    
    // Buscar regiões disponíveis
    const fetchCacRegioes = async () => {
      const { data } = await supabase
        .from("vendas")
        .select("estado")
        .not("estado", "is", null);
      
      const regionesUnicas = [...new Set(data?.map((v: any) => v.estado))] as string[];
      setCacRegioes(["all", ...regionesUnicas]);
    };
    
    fetchCacRegioes();
  }, []);

  useEffect(() => {
    if (cacMeses.length > 0) {
      setCacMes(cacMeses[cacMesIndex]);
    }
  }, [cacMesIndex, cacMeses]);

  useEffect(() => {
    if (cacRegioes.length > 0) {
      setCacRegiao(cacRegioes[cacRegiaoIndex]);
    }
  }, [cacRegiaoIndex, cacRegioes]);

  const fetchWhatsAppData = async () => {
    setLoadingWhatsApp(true);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    try {
      // Buscar dados dos últimos 30 dias
      const { data: clicksData, error } = await supabase
        .from("whatsapp_roulette_clicks")
        .select("*")
        .gte("created_at", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Erro ao buscar dados da roleta:", error);
        return;
      }

      setWhatsAppClicks(clicksData || []);

      // Calcular stats por atendente
      const atendenteMap: Record<string, number> = {};
      (clicksData || []).forEach(click => {
        atendenteMap[click.atendente_nome] = (atendenteMap[click.atendente_nome] || 0) + 1;
      });

      const atendenteStatsArray = Object.entries(atendenteMap).map(([nome, total_clicks]) => ({
        nome,
        total_clicks
      })).sort((a, b) => b.total_clicks - a.total_clicks);

      setAtendenteStats(atendenteStatsArray);

      // Calcular stats por canal
      const canalMap: Record<string, number> = {};
      (clicksData || []).forEach(click => {
        let canal = 'Outros';
        
        if (click.fbclid || click.utm_source?.toLowerCase().includes('facebook') || click.utm_source?.toLowerCase().includes('meta')) {
          canal = 'Meta (Facebook/Instagram)';
        } else if (click.gclid || click.utm_source?.toLowerCase().includes('google')) {
          canal = 'Google';
        } else if (click.utm_source) {
          canal = click.utm_source;
        } else if (click.source) {
          canal = click.source;
        }

        canalMap[canal] = (canalMap[canal] || 0) + 1;
      });

      const canalStatsArray = Object.entries(canalMap).map(([canal, total_clicks]) => ({
        canal,
        total_clicks
      })).sort((a, b) => b.total_clicks - a.total_clicks);

      setCanalStats(canalStatsArray);

      // Calcular stats por referenciador
      const referrerMap: Record<string, number> = {};
      (clicksData || []).forEach(click => {
        const referrer = click.referrer ? new URL(click.referrer).hostname : 'Acesso Direto';
        referrerMap[referrer] = (referrerMap[referrer] || 0) + 1;
      });

      const referrerStatsArray = Object.entries(referrerMap).map(([referrer, total_clicks]) => ({
        referrer,
        total_clicks
      })).sort((a, b) => b.total_clicks - a.total_clicks);

      setReferrerStats(referrerStatsArray);

    } catch (error) {
      console.error("Erro ao processar dados da roleta:", error);
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const fetchVendedores = async () => {
    if (!vendasDateRange?.from || !vendasDateRange?.to) return;
    
    try {
      // Buscar apenas atendentes ativos
      const { data: users } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url, role")
        .eq("ativo", true)
        .eq("role", "atendente")
        .order("nome");

      if (!users) return;

      // Buscar quantidade de vendas por vendedor no período
      const { data: vendas } = await supabase
        .from("vendas")
        .select("atendente_id")
        .gte("data_venda", format(vendasDateRange.from, "yyyy-MM-dd"))
        .lte("data_venda", format(vendasDateRange.to, "yyyy-MM-dd"));

      const vendasCount = (vendas || []).reduce((acc: Record<string, number>, venda) => {
        acc[venda.atendente_id] = (acc[venda.atendente_id] || 0) + 1;
        return acc;
      }, {});

      // Criar lista completa com "Todos" no início
      const vendedoresComTodos: VendedorCompleto[] = [
        {
          id: "all",
          nome: "Todos os Vendedores",
          foto_perfil_url: null,
          role: "",
          vendasCount: vendas?.length || 0
        },
        ...users.map(u => ({
          id: u.user_id,
          nome: u.nome,
          foto_perfil_url: u.foto_perfil_url,
          role: u.role,
          vendasCount: vendasCount[u.user_id] || 0
        }))
      ];
      
      setVendedoresCompletos(vendedoresComTodos);
    } catch (error) {
      console.error("Erro ao buscar vendedores:", error);
    }
  };

  const fetchPublicoAlvoData = async () => {
    if (!vendasDateRange?.from || !vendasDateRange?.to || vendedoresCompletos.length === 0) return;
    
    setLoadingVendas(true);
    try {
      const vendedorAtual = vendedoresCompletos[vendedorIndexPublicoAlvo];
      
      let query = supabase
        .from("vendas")
        .select("publico_alvo, valor_venda, valor_frete")
        .gte("data_venda", format(vendasDateRange.from, "yyyy-MM-dd"))
        .lte("data_venda", format(vendasDateRange.to, "yyyy-MM-dd"));

      if (vendedorAtual?.id !== "all") {
        query = query.eq("atendente_id", vendedorAtual.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const grouped = (data || []).reduce((acc: Record<string, number>, venda) => {
        const publico = venda.publico_alvo || "Não Informado";
        const faturamento = (venda.valor_venda || 0) - (venda.valor_frete || 0);
        acc[publico] = (acc[publico] || 0) + faturamento;
        return acc;
      }, {});

      const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }));
      setPublicoAlvoData(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados de público alvo:", error);
    } finally {
      setLoadingVendas(false);
    }
  };

  const fetchCanalAquisicaoData = async () => {
    if (!vendasDateRange?.from || !vendasDateRange?.to || vendedoresCompletos.length === 0) return;
    
    setLoadingVendas(true);
    try {
      const vendedorAtual = vendedoresCompletos[vendedorIndexCanalAquisicao];
      
      let query = supabase
        .from("vendas")
        .select("canal_aquisicao_id, valor_venda, valor_frete, canais_aquisicao(nome)")
        .gte("data_venda", format(vendasDateRange.from, "yyyy-MM-dd"))
        .lte("data_venda", format(vendasDateRange.to, "yyyy-MM-dd"));

      if (vendedorAtual?.id !== "all") {
        query = query.eq("atendente_id", vendedorAtual.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const grouped = (data || []).reduce((acc: Record<string, number>, venda: any) => {
        const canal = venda.canais_aquisicao?.nome || "Não Informado";
        const faturamento = (venda.valor_venda || 0) - (venda.valor_frete || 0);
        acc[canal] = (acc[canal] || 0) + faturamento;
        return acc;
      }, {});

      const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }));
      setCanalAquisicaoData(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados de canal de aquisição:", error);
    } finally {
      setLoadingVendas(false);
    }
  };

  const fetchEstadoData = async () => {
    if (!vendasDateRange?.from || !vendasDateRange?.to || vendedoresCompletos.length === 0) return;
    
    setLoadingVendas(true);
    try {
      const vendedorAtual = vendedoresCompletos[vendedorIndexEstado];
      
      let query = supabase
        .from("vendas")
        .select("estado, valor_venda, valor_frete")
        .gte("data_venda", format(vendasDateRange.from, "yyyy-MM-dd"))
        .lte("data_venda", format(vendasDateRange.to, "yyyy-MM-dd"));

      if (vendedorAtual?.id !== "all") {
        query = query.eq("atendente_id", vendedorAtual.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const grouped = (data || []).reduce((acc: Record<string, number>, venda) => {
        const estado = venda.estado || "Não Informado";
        const faturamento = (venda.valor_venda || 0) - (venda.valor_frete || 0);
        acc[estado] = (acc[estado] || 0) + faturamento;
        return acc;
      }, {});

      const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }));
      setEstadoData(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados de estado:", error);
    } finally {
      setLoadingVendas(false);
    }
  };

  const fetchCacData = async () => {
    if (!cacMes || vendedoresCompletos.length === 0) return;
    
    setLoadingCAC(true);
    try {
      const mesInicio = format(cacMes, "yyyy-MM-dd");
      const mesFim = format(endOfMonth(cacMes), "yyyy-MM-dd");
      const mesFormatado = format(cacMes, "yyyy-MM") + "-01";

      // 1. Buscar canais pagos
      const { data: canaisPagos } = await supabase
        .from("canais_aquisicao")
        .select("id, nome")
        .eq("ativo", true)
        .eq("pago", true)
        .order("ordem");

      // 2. Buscar investimentos do mês/região
      let investQuery = supabase
        .from("marketing_investimentos")
        .select("*")
        .eq("mes", mesFormatado);
      
      if (cacRegiao !== "all") {
        investQuery = investQuery.eq("regiao", cacRegiao);
      }
      
      const { data: investimentos } = await investQuery;

      // 3. Buscar vendas do mês com produtos
      const vendedorAtual = vendedoresCompletos[vendedorIndexCAC];
      
      let vendasQuery = supabase
        .from("vendas")
        .select(`
          id, 
          canal_aquisicao_id, 
          valor_venda, 
          valor_frete, 
          lucro_total,
          estado,
          produtos_vendas(faturamento)
        `)
        .gte("data_venda", mesInicio)
        .lte("data_venda", mesFim + " 23:59:59");

      if (vendedorAtual?.id !== "all") {
        vendasQuery = vendasQuery.eq("atendente_id", vendedorAtual.id);
      }
      
      if (cacRegiao !== "all") {
        vendasQuery = vendasQuery.eq("estado", cacRegiao);
      }

      const { data: vendas } = await vendasQuery;

      // 4. Mapear investimentos por canal
      const investimentoPorCanal: Record<string, number> = {};
      
      canaisPagos?.forEach(canal => {
        const key = canal.nome.toLowerCase();
        let total = 0;
        
        investimentos?.forEach(inv => {
          if (key.includes("google")) {
            total += Number(inv.investimento_google_ads || 0);
          } else if (key.includes("meta") || key.includes("facebook") || key.includes("instagram")) {
            total += Number(inv.investimento_meta_ads || 0);
          } else if (key.includes("linkedin")) {
            total += Number(inv.investimento_linkedin_ads || 0);
          }
        });
        
        investimentoPorCanal[canal.id] = total;
      });

      // 5. Calcular métricas por canal
      const cacPorCanal: CacCanalData[] = [];
      
      canaisPagos?.forEach(canal => {
        const vendasDoCanal = vendas?.filter((v: any) => v.canal_aquisicao_id === canal.id) || [];
        const totalVendas = vendasDoCanal.length;
        
        // Contar vendas faturadas
        let vendasFaturadas = 0;
        vendasDoCanal.forEach((venda: any) => {
          const produtos = venda.produtos_vendas || [];
          if (produtos.length > 0 && produtos.every((p: any) => p.faturamento === true)) {
            vendasFaturadas++;
          }
        });
        
        const faturamento = vendasDoCanal.reduce((sum: number, v: any) => 
          sum + (Number(v.valor_venda || 0) - Number(v.valor_frete || 0)), 0);
        const lucro = vendasDoCanal.reduce((sum: number, v: any) => sum + Number(v.lucro_total || 0), 0);
        const investimento = investimentoPorCanal[canal.id] || 0;
        
        const lucroLiquido = lucro - investimento;
        const roi = investimento > 0 ? ((faturamento - investimento) / investimento) * 100 : 0;
        const cac = (investimento > 0 && totalVendas > 0) ? investimento / totalVendas : 0;
        
        cacPorCanal.push({
          canal_id: canal.id,
          canal_nome: canal.nome,
          investimento,
          faturamento,
          lucro,
          lucroLiquido,
          roi,
          cac,
          totalVendas,
          vendasFaturadas,
          vendasPendentes: totalVendas - vendasFaturadas
        });
      });
      
      setCacData(cacPorCanal);
    } catch (error) {
      console.error("Erro ao buscar dados de CAC:", error);
    } finally {
      setLoadingCAC(false);
    }
  };

  const canalChartData = useMemo(() => {
    return canalStats.map(stat => ({
      canal: stat.canal,
      cliques: stat.total_clicks
    }));
  }, [canalStats]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  const clicksFiltrados = useMemo(() => {
    return whatsAppClicks.filter(click => {
      const clickDate = new Date(click.created_at);
      const inicio = new Date(dataInicio);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      return clickDate >= inicio && clickDate <= fim;
    });
  }, [whatsAppClicks, dataInicio, dataFim]);

  // Detectar cliques duplicados (mesmo horário arredondado para minuto + mesmo referrer)
  const clicksComDuplicatas = useMemo(() => {
    const clicksMap = new Map<string, number>();
    
    return clicksFiltrados.map(click => {
      const clickMinute = format(new Date(click.created_at), "yyyy-MM-dd HH:mm");
      const referrer = click.referrer ? new URL(click.referrer).hostname : 'Acesso Direto';
      const key = `${clickMinute}|${referrer}`;
      
      const count = clicksMap.get(key) || 0;
      clicksMap.set(key, count + 1);
      
      return {
        ...click,
        isDuplicate: count > 0 // Se já existe um click com mesmo horário/referrer
      };
    });
  }, [clicksFiltrados]);

  return (
    <TooltipProvider>
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Performance</h1>
        <p className="text-sm sm:text-base md:text-xl text-muted-foreground">
          Análise de cliques da roleta WhatsApp do mês de {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Nova seção de Vendas */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Análise de Vendas por Faturamento</CardTitle>
            
            {/* Filtro de Datas */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {vendasDateRange?.from ? (
                    vendasDateRange.to ? (
                      `${format(vendasDateRange.from, "dd/MM/yy")} - ${format(vendasDateRange.to, "dd/MM/yy")}`
                    ) : format(vendasDateRange.from, "dd/MM/yyyy")
                  ) : "Selecionar período"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={vendasDateRange}
                  onSelect={setVendasDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de 3 gráficos de pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        
        {/* Gráfico 1: Público Alvo */}
        <Card>
          <CardHeader className="pb-2 space-y-3">
            <CardTitle className="text-sm">Vendas por Público Alvo</CardTitle>
            
            {/* Card do vendedor com navegação */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexPublicoAlvo(prev => 
                  prev === 0 ? vendedoresCompletos.length - 1 : prev - 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1 min-w-0 bg-muted/50 rounded-lg p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={vendedoresCompletos[vendedorIndexPublicoAlvo]?.foto_perfil_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {vendedoresCompletos[vendedorIndexPublicoAlvo]?.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {vendedoresCompletos[vendedorIndexPublicoAlvo]?.nome}
                  </p>
                  <div className="flex items-center gap-2">
                    {vendedoresCompletos[vendedorIndexPublicoAlvo]?.role && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {ROLE_LABELS[vendedoresCompletos[vendedorIndexPublicoAlvo]?.role] || vendedoresCompletos[vendedorIndexPublicoAlvo]?.role}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {vendedoresCompletos[vendedorIndexPublicoAlvo]?.vendasCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexPublicoAlvo(prev => 
                  prev === vendedoresCompletos.length - 1 ? 0 : prev + 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingVendas ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-muted-foreground text-sm">Carregando...</div>
              </div>
            ) : publicoAlvoData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-muted-foreground text-sm">Sem dados no período</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={publicoAlvoData} 
                    dataKey="value" 
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: R$ ${entry.value.toLocaleString('pt-BR')}`}
                    labelLine={false}
                  >
                    {publicoAlvoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 2: Canal de Aquisição */}
        <Card>
          <CardHeader className="pb-2 space-y-3">
            <CardTitle className="text-sm">Vendas por Canal de Aquisição</CardTitle>
            
            {/* Card do vendedor com navegação */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexCanalAquisicao(prev => 
                  prev === 0 ? vendedoresCompletos.length - 1 : prev - 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1 min-w-0 bg-muted/50 rounded-lg p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={vendedoresCompletos[vendedorIndexCanalAquisicao]?.foto_perfil_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {vendedoresCompletos[vendedorIndexCanalAquisicao]?.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {vendedoresCompletos[vendedorIndexCanalAquisicao]?.nome}
                  </p>
                  <div className="flex items-center gap-2">
                    {vendedoresCompletos[vendedorIndexCanalAquisicao]?.role && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {ROLE_LABELS[vendedoresCompletos[vendedorIndexCanalAquisicao]?.role] || vendedoresCompletos[vendedorIndexCanalAquisicao]?.role}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {vendedoresCompletos[vendedorIndexCanalAquisicao]?.vendasCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexCanalAquisicao(prev => 
                  prev === vendedoresCompletos.length - 1 ? 0 : prev + 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingVendas ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-muted-foreground text-sm">Carregando...</div>
              </div>
            ) : canalAquisicaoData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-muted-foreground text-sm">Sem dados no período</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={canalAquisicaoData} 
                    dataKey="value" 
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: R$ ${entry.value.toLocaleString('pt-BR')}`}
                    labelLine={false}
                  >
                    {canalAquisicaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 3: Estado */}
        <Card>
          <CardHeader className="pb-2 space-y-3">
            <CardTitle className="text-sm">Vendas por Estado</CardTitle>
            
            {/* Card do vendedor com navegação */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexEstado(prev => 
                  prev === 0 ? vendedoresCompletos.length - 1 : prev - 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1 min-w-0 bg-muted/50 rounded-lg p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={vendedoresCompletos[vendedorIndexEstado]?.foto_perfil_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {vendedoresCompletos[vendedorIndexEstado]?.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {vendedoresCompletos[vendedorIndexEstado]?.nome}
                  </p>
                  <div className="flex items-center gap-2">
                    {vendedoresCompletos[vendedorIndexEstado]?.role && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {ROLE_LABELS[vendedoresCompletos[vendedorIndexEstado]?.role] || vendedoresCompletos[vendedorIndexEstado]?.role}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {vendedoresCompletos[vendedorIndexEstado]?.vendasCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexEstado(prev => 
                  prev === vendedoresCompletos.length - 1 ? 0 : prev + 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingVendas ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-muted-foreground text-sm">Carregando...</div>
              </div>
            ) : estadoData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-muted-foreground text-sm">Sem dados no período</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={estadoData} 
                    dataKey="value" 
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: R$ ${entry.value.toLocaleString('pt-BR')}`}
                    labelLine={false}
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção de Análise de CAC */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5" />
            Análise de CAC por Canal Pago
          </CardTitle>
          
          {/* Sliders dos três filtros lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Slider de Mês */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCacMesIndex(prev => 
                  prev === cacMeses.length - 1 ? 0 : prev + 1
                )}
                disabled={cacMeses.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1 bg-muted/50 rounded-lg p-2 justify-center">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">
                  {cacMeses[cacMesIndex] && format(cacMeses[cacMesIndex], "MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCacMesIndex(prev => 
                  prev === 0 ? cacMeses.length - 1 : prev - 1
                )}
                disabled={cacMeses.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Slider de Região */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCacRegiaoIndex(prev => 
                  prev === 0 ? cacRegioes.length - 1 : prev - 1
                )}
                disabled={cacRegioes.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1 bg-muted/50 rounded-lg p-2 justify-center">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">
                  {cacRegioes[cacRegiaoIndex] === "all" ? "Todas Regiões" : cacRegioes[cacRegiaoIndex]}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCacRegiaoIndex(prev => 
                  prev === cacRegioes.length - 1 ? 0 : prev + 1
                )}
                disabled={cacRegioes.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Slider de Atendente */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexCAC(prev => 
                  prev === 0 ? vendedoresCompletos.length - 1 : prev - 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3 flex-1 bg-muted/50 rounded-lg p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={vendedoresCompletos[vendedorIndexCAC]?.foto_perfil_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {vendedoresCompletos[vendedorIndexCAC]?.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {vendedoresCompletos[vendedorIndexCAC]?.nome}
                  </p>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {vendedoresCompletos[vendedorIndexCAC]?.vendasCount || 0} vendas
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVendedorIndexCAC(prev => 
                  prev === vendedoresCompletos.length - 1 ? 0 : prev + 1
                )}
                disabled={vendedoresCompletos.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loadingCAC ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Lucro
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Lucro das vendas faturadas
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Lucro Líquido</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="text-right">CAC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cacData.map((canal) => (
                    <TableRow key={canal.canal_id}>
                      <TableCell className="font-medium">{canal.canal_nome}</TableCell>
                      <TableCell className="text-right">
                        R$ {canal.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {canal.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          R$ {canal.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {canal.vendasPendentes > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {canal.vendasPendentes} venda{canal.vendasPendentes !== 1 ? 's' : ''} pendente{canal.vendasPendentes !== 1 ? 's' : ''} de faturamento
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={canal.lucroLiquido >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          R$ {canal.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={canal.roi >= 100 ? "default" : canal.roi >= 0 ? "secondary" : "destructive"}>
                          {canal.roi.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {canal.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {cacData.length > 0 && (
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        R$ {cacData.reduce((sum, c) => sum + c.investimento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {cacData.reduce((sum, c) => sum + c.faturamento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          R$ {cacData.reduce((sum, c) => sum + c.lucro, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {cacData.reduce((sum, c) => sum + c.vendasPendentes, 0) > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {cacData.reduce((sum, c) => sum + c.vendasPendentes, 0)} vendas pendentes de faturamento
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const totalLucroLiquido = cacData.reduce((sum, c) => sum + c.lucroLiquido, 0);
                          return (
                            <span className={totalLucroLiquido >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              R$ {totalLucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {(() => {
                            const totalInv = cacData.reduce((sum, c) => sum + c.investimento, 0);
                            const totalFat = cacData.reduce((sum, c) => sum + c.faturamento, 0);
                            return totalInv > 0 ? (((totalFat - totalInv) / totalInv) * 100).toFixed(1) : 0;
                          })()}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(() => {
                          const totalInv = cacData.reduce((sum, c) => sum + c.investimento, 0);
                          const totalVendas = cacData.reduce((sum, c) => sum + c.totalVendas, 0);
                          return (totalInv > 0 && totalVendas > 0 ? totalInv / totalVendas : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        })()}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicadores da Roleta WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Cliques por Atendente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Cliques por Atendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWhatsApp ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {atendenteStats.slice(0, 10).map((atendente, index) => (
                  <div key={atendente.nome} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}º</Badge>
                      <span className="font-medium text-sm">{atendente.nome}</span>
                    </div>
                    <Badge variant="secondary">{atendente.total_clicks}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cliques por Canal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cliques por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWhatsApp ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {canalStats.slice(0, 10).map((canal, index) => (
                  <div key={canal.canal} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={canal.canal === 'Meta (Facebook/Instagram)' ? 'default' : 
                               canal.canal === 'Google' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {canal.canal}
                      </Badge>
                    </div>
                    <Badge variant="secondary">{canal.total_clicks}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Referenciadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Ranking de Referenciadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWhatsApp ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {referrerStats.slice(0, 10).map((referrer, index) => (
                  <div key={referrer.referrer} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}º</Badge>
                      <span className="font-medium text-xs truncate max-w-[120px]">{referrer.referrer}</span>
                    </div>
                    <Badge variant="secondary">{referrer.total_clicks}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Cliques */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mouse className="h-5 w-5" />
              <CardTitle>Histórico Recente de Cliques</CardTitle>
              <Badge variant="outline">{clicksFiltrados.length}</Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataInicio, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => date && setDataInicio(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-sm text-muted-foreground">até</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataFim, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => date && setDataFim(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const hoje = new Date();
                  setDataInicio(hoje);
                  setDataFim(hoje);
                }}
              >
                Hoje
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingWhatsApp ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando histórico...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="whitespace-nowrap text-xs h-8 py-1">Data/Hora</TableHead>
                    <TableHead className="whitespace-nowrap text-xs h-8 py-1">Atendente</TableHead>
                    <TableHead className="whitespace-nowrap text-xs h-8 py-1">Canal</TableHead>
                    <TableHead className="whitespace-nowrap text-xs h-8 py-1 hidden sm:table-cell">Telefone</TableHead>
                    <TableHead className="whitespace-nowrap text-xs h-8 py-1 hidden md:table-cell">Referenciador</TableHead>
                    <TableHead className="whitespace-nowrap text-xs h-8 py-1 hidden lg:table-cell">Origem</TableHead>
                    <TableHead className="whitespace-nowrap text-xs h-8 py-1 hidden lg:table-cell">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clicksComDuplicatas.map((click) => {
                  let canal = 'Outros';
                  if (click.fbclid || click.utm_source?.toLowerCase().includes('facebook') || click.utm_source?.toLowerCase().includes('meta')) {
                    canal = 'Meta';
                  } else if (click.gclid || click.utm_source?.toLowerCase().includes('google')) {
                    canal = 'Google';
                  } else if (click.utm_source) {
                    canal = click.utm_source;
                  }

                    return (
                      <TableRow 
                        key={click.id} 
                        className={cn(
                          "h-[35px]",
                          click.isDuplicate && "bg-destructive/10 border-l-2 border-destructive"
                        )}
                      >
                        <TableCell className="whitespace-nowrap text-xs h-[35px] py-1">
                          <div className="flex items-center gap-1">
                            {click.isDuplicate && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                DUP
                              </Badge>
                            )}
                            {format(new Date(click.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-xs h-[35px] py-1">{click.atendente_nome}</TableCell>
                        <TableCell className="h-[35px] py-1">
                          <Badge 
                            variant={canal === 'Meta' ? 'default' : 
                                   canal === 'Google' ? 'secondary' : 'outline'}
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {canal}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs h-[35px] py-1">{click.atendente_telefone || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-[10px] text-muted-foreground h-[35px] py-1">
                          {click.referrer ? new URL(click.referrer).hostname : 'Acesso Direto'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-[10px] text-muted-foreground h-[35px] py-1">
                          {click.page_url ? new URL(click.page_url).hostname : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-[10px] text-muted-foreground h-[35px] py-1">
                          {click.ip || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}