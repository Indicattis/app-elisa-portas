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
import { MinimalistLayout } from "@/components/MinimalistLayout";

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

// Cores para gráficos em tema escuro
const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', 
  '#06b6d4', '#eab308', '#ef4444', '#6366f1', '#14b8a6'
];

export default function PerformanceMinimalista() {
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
      const { data: users } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url, role")
        .eq("ativo", true)
        .eq("role", "atendente")
        .order("nome");

      if (!users) return;

      const { data: vendas } = await supabase
        .from("vendas")
        .select("atendente_id")
        .gte("data_venda", format(vendasDateRange.from, "yyyy-MM-dd"))
        .lte("data_venda", format(vendasDateRange.to, "yyyy-MM-dd"));

      const vendasCount = (vendas || []).reduce((acc: Record<string, number>, venda) => {
        acc[venda.atendente_id] = (acc[venda.atendente_id] || 0) + 1;
        return acc;
      }, {});

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
          produtos_vendas(faturamento, valor_total)
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
        const vendasDoCanal = vendas?.filter(v => v.canal_aquisicao_id === canal.id) || [];
        const totalVendas = vendasDoCanal.length;
        
        // Calcular faturamento (soma dos faturamentos dos produtos)
        let faturamento = 0;
        let vendasFaturadas = 0;
        let vendasPendentes = 0;
        
        vendasDoCanal.forEach((venda: any) => {
          const produtosFaturados = venda.produtos_vendas?.filter((p: any) => p.faturamento === true) || [];
          if (produtosFaturados.length > 0) {
            vendasFaturadas++;
            faturamento += produtosFaturados.reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0);
          } else {
            vendasPendentes++;
          }
        });

        // Calcular lucro
        const lucro = vendasDoCanal.reduce((sum, v) => sum + (v.lucro_total || 0), 0);
        
        const investimento = investimentoPorCanal[canal.id] || 0;
        const lucroLiquido = lucro - investimento;
        const roi = investimento > 0 ? ((faturamento - investimento) / investimento) * 100 : 0;
        const cac = totalVendas > 0 ? investimento / totalVendas : 0;

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
          vendasPendentes
        });
      });

      setCacData(cacPorCanal);
    } catch (error) {
      console.error("Erro ao buscar dados de CAC:", error);
    } finally {
      setLoadingCAC(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const totalClicks = whatsAppClicks.length;

  const VendedorCarousel = ({ 
    vendedores, 
    currentIndex, 
    onIndexChange 
  }: { 
    vendedores: VendedorCompleto[], 
    currentIndex: number, 
    onIndexChange: (index: number) => void 
  }) => {
    if (vendedores.length === 0) return null;
    
    const currentVendedor = vendedores[currentIndex];
    
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
          onClick={() => onIndexChange((currentIndex - 1 + vendedores.length) % vendedores.length)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-[180px] justify-center">
          {currentVendedor.id !== "all" && (
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage src={currentVendedor.foto_perfil_url || undefined} />
              <AvatarFallback className="text-xs bg-blue-500/30 text-white">
                {currentVendedor.nome.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-white">{currentVendedor.nome}</p>
            <p className="text-xs text-white/60">{currentVendedor.vendasCount} vendas</p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => onIndexChange((currentIndex + 1) % vendedores.length)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <MinimalistLayout
      title="Performance"
      subtitle="Análise de performance de marketing"
      backPath="/marketing"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Marketing", path: "/marketing" },
        { label: "Performance" }
      ]}
    >
      <div className="space-y-6">
        {/* Seção de CAC por Canal Pago */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white">CAC por Canal Pago</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-white/50" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-white/10 text-white max-w-xs">
                      <p>Custo de Aquisição de Cliente por canal de marketing pago. Calculado dividindo o investimento pelo número de vendas.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setCacMesIndex((cacMesIndex + 1) % cacMeses.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-white min-w-[120px] text-center">
                    {cacMes && format(cacMes, "MMMM yyyy", { locale: ptBR })}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setCacMesIndex((cacMesIndex - 1 + cacMeses.length) % cacMeses.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setCacRegiaoIndex((cacRegiaoIndex - 1 + cacRegioes.length) % cacRegioes.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-white min-w-[80px] text-center">
                    {cacRegiao === "all" ? "Todas Regiões" : cacRegiao}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setCacRegiaoIndex((cacRegiaoIndex + 1) % cacRegioes.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <VendedorCarousel 
                  vendedores={vendedoresCompletos} 
                  currentIndex={vendedorIndexCAC}
                  onIndexChange={setVendedorIndexCAC}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCAC ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : cacData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/60">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Nenhum canal pago configurado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Canal</TableHead>
                      <TableHead className="text-white/70 text-right">Investimento</TableHead>
                      <TableHead className="text-white/70 text-right">Vendas</TableHead>
                      <TableHead className="text-white/70 text-right">Faturamento</TableHead>
                      <TableHead className="text-white/70 text-right">Lucro</TableHead>
                      <TableHead className="text-white/70 text-right">CAC</TableHead>
                      <TableHead className="text-white/70 text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cacData.map((canal) => (
                      <TableRow key={canal.canal_id} className="border-white/10">
                        <TableCell className="text-white font-medium">{canal.canal_nome}</TableCell>
                        <TableCell className="text-white/80 text-right">{formatCurrency(canal.investimento)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-white/80">{canal.totalVendas}</span>
                            {canal.vendasPendentes > 0 && (
                              <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                {canal.vendasPendentes} pendente{canal.vendasPendentes > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80 text-right">{formatCurrency(canal.faturamento)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          canal.lucroLiquido >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {formatCurrency(canal.lucroLiquido)}
                        </TableCell>
                        <TableCell className="text-white/80 text-right">{formatCurrency(canal.cac)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          canal.roi >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {canal.roi.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Análise de Vendas */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Análise de Vendas</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vendasDateRange?.from && vendasDateRange?.to ? (
                      <>
                        {format(vendasDateRange.from, "dd/MM/yy")} - {format(vendasDateRange.to, "dd/MM/yy")}
                      </>
                    ) : (
                      "Selecionar período"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={vendasDateRange?.from}
                    selected={vendasDateRange}
                    onSelect={setVendasDateRange}
                    numberOfMonths={2}
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Público Alvo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Por Público Alvo</h4>
                  <VendedorCarousel 
                    vendedores={vendedoresCompletos} 
                    currentIndex={vendedorIndexPublicoAlvo}
                    onIndexChange={setVendedorIndexPublicoAlvo}
                  />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={publicoAlvoData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {publicoAlvoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Canal de Aquisição */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Por Canal de Aquisição</h4>
                  <VendedorCarousel 
                    vendedores={vendedoresCompletos} 
                    currentIndex={vendedorIndexCanalAquisicao}
                    onIndexChange={setVendedorIndexCanalAquisicao}
                  />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={canalAquisicaoData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {canalAquisicaoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Estado */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Por Estado</h4>
                  <VendedorCarousel 
                    vendedores={vendedoresCompletos} 
                    currentIndex={vendedorIndexEstado}
                    onIndexChange={setVendedorIndexEstado}
                  />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={estadoData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {estadoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listagem de Cliques da Roleta WhatsApp */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-400" />
              Cliques da Roleta WhatsApp
              <Badge variant="outline" className="ml-2 text-white/60 border-white/20">
                {whatsAppClicks.length} cliques
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWhatsApp ? (
              <div className="text-center py-8 text-white/50">Carregando...</div>
            ) : whatsAppClicks.length === 0 ? (
              <div className="text-center py-8 text-white/50">Nenhum clique encontrado no período</div>
            ) : (
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Data/Hora</TableHead>
                      <TableHead className="text-white/60">Atendente</TableHead>
                      <TableHead className="text-white/60">Canal</TableHead>
                      <TableHead className="text-white/60">UTM Source</TableHead>
                      <TableHead className="text-white/60">UTM Campaign</TableHead>
                      <TableHead className="text-white/60">Referrer</TableHead>
                      <TableHead className="text-white/60">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsAppClicks.map((click) => {
                      const canal = click.fbclid
                        ? "Facebook Ads"
                        : click.gclid
                        ? "Google Ads"
                        : click.utm_source
                        ? click.utm_source
                        : click.traffic_channel || "Direto";

                      return (
                        <TableRow key={click.id} className="border-white/10">
                          <TableCell className="text-white/80 text-xs">
                            {format(new Date(click.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-white font-medium text-sm">
                            {click.atendente_nome}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                              {canal}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/60 text-xs">
                            {click.utm_source || "-"}
                          </TableCell>
                          <TableCell className="text-white/60 text-xs">
                            {click.utm_campaign || "-"}
                          </TableCell>
                          <TableCell className="text-white/60 text-xs truncate max-w-[200px]">
                            {click.referrer || "-"}
                          </TableCell>
                          <TableCell className="text-white/60 text-xs">
                            {click.ip || "-"}
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
    </MinimalistLayout>
  );
}
