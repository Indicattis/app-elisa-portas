import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Users, Target, Plus, Edit, Palette, Package, Receipt } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";

interface MarketingInvestment {
  id: string;
  mes: string;
  regiao?: string;
  investimento_google_ads: number;
  investimento_meta_ads: number;
  investimento_linkedin_ads: number;
  outros_investimentos: number;
  observacoes?: string;
}

interface MarketingMetrics {
  totalInvestimento: number;
  totalVendas: number;
  roi: number | null;
  cac: number | null;
  vendasConvertidas: number;
}

interface PublicoAlvoData {
  name: string;
  value: number;
  vendas: number;
}

interface CanalAquisicaoData {
  name: string;
  value: number;
  vendas: number;
}

interface RegionPerformanceData {
  regiao: string;
  investimento: number;
  faturamento: number;
  vendas: number;
  lucro: number;
  cac: number;
  ticketMedio: number;
  roi: number;
}

export default function MarketingAnalise() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedRegiao, setSelectedRegiao] = useState<string>("all");
  const [investimentos, setInvestimentos] = useState<MarketingInvestment[]>([]);
  const [investimentosHistorico, setInvestimentosHistorico] = useState<MarketingInvestment[]>([]);
  const [metrics, setMetrics] = useState<MarketingMetrics>({
    totalInvestimento: 0,
    totalVendas: 0,
    roi: null,
    cac: null,
    vendasConvertidas: 0
  });
  const [regioes, setRegioes] = useState<string[]>([]);
  const [publicoAlvoData, setPublicoAlvoData] = useState<PublicoAlvoData[]>([]);
  const [canalAquisicaoData, setCanalAquisicaoData] = useState<CanalAquisicaoData[]>([]);
  const [regionPerformanceData, setRegionPerformanceData] = useState<RegionPerformanceData[]>([]);
  const [corMaisVendida, setCorMaisVendida] = useState<{ cor: string; quantidade: number } | null>(null);
  const [produtoMaisVendido, setProdutoMaisVendido] = useState<{ produto: string; quantidade: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'quantidade' | 'faturamento'>('quantidade');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestimento, setEditingInvestimento] = useState<MarketingInvestment | null>(null);
  const { canais } = useCanaisAquisicao();
  const [newInvestment, setNewInvestment] = useState({
    mes: format(new Date(), "yyyy-MM"),
    regiao: "geral",
    investimento_google_ads: 0,
    investimento_meta_ads: 0,
    investimento_linkedin_ads: 0,
    outros_investimentos: 0,
    observacoes: ""
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      await fetchData();
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadMetrics = async () => {
      if (!isMounted) return;
      await Promise.all([
        fetchMetrics(),
        fetchChartData(),
        fetchRegionPerformance(),
        fetchCoresMaisVendidas(),
        fetchProdutosMaisVendidos()
      ]);
    };
    
    loadMetrics();
    
    return () => {
      isMounted = false;
    };
  }, [selectedRegiao, dateRange]);

  // Helper para evitar erro de tipos profundos do Supabase
  const fetchVendasFaturadas = async (startDate: string, endDate: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select("valor_venda, valor_frete, custo_total, atendente_id, estado, canal_aquisicao_id, data_venda");
      
      if (error) throw error;
      
      // Filtrar manualmente para evitar erro de tipos profundos (TODAS as vendas, independente de custo_total)
      return (data || []).filter((v: any) => 
        v.data_venda >= startDate &&
        v.data_venda <= endDate
      );
    } catch (error) {
      console.error("Erro ao buscar vendas faturadas:", error);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvestimentos(),
        fetchInvestimentosHistorico(),
        fetchRegioes(),
        fetchMetrics(),
        fetchChartData(),
        fetchRegionPerformance()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de marketing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestimentos = async () => {
    try {
      console.log("Buscando investimentos para período:", dateRange?.from, "a", dateRange?.to);
      
      const startMonth = dateRange?.from ? format(dateRange.from, "yyyy-MM") + "-01" : null;
      const endMonth = dateRange?.to ? format(dateRange.to, "yyyy-MM") + "-01" : null;
      
      const { data, error }: any = await supabase
        .from("marketing_investimentos")
        .select("*")
        .gte("mes", startMonth)
        .lte("mes", endMonth)
        .order("mes", { ascending: false });

      if (error) {
        console.error("Erro ao buscar investimentos:", error);
        return;
      }
      
      console.log("Dados de investimentos encontrados:", data);
      setInvestimentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar investimentos:", error);
    }
  };

  const fetchInvestimentosHistorico = async () => {
    try {
      const { data, error }: any = await supabase
        .from("marketing_investimentos")
        .select("*")
        .order("mes", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Erro ao buscar histórico de investimentos:", error);
        return;
      }
      
      setInvestimentosHistorico(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico de investimentos:", error);
    }
  };

  const fetchRegioes = async () => {
    const { data, error } = await (supabase
      .from("vendas")
      .select("estado")
      .not("estado", "is", null) as any);

    if (error) throw error;
    const regionesUnicas = [...new Set(data?.map((v: any) => v.estado))] as string[];
    setRegioes(regionesUnicas);
  };

  const fetchMetrics = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = format(dateRange.to, "yyyy-MM-dd");

      // Buscar investimentos com tratamento de erro
      const { data: investimentosData, error: investimentosError } = await supabase
        .from("marketing_investimentos")
        .select("*")
        .gte("mes", format(dateRange.from, "yyyy-MM") + "-01")
        .lte("mes", format(dateRange.to, "yyyy-MM") + "-01");

      if (investimentosError) {
        console.error("Erro ao buscar investimentos:", investimentosError);
      }

      // Filtrar por região se necessário
      const investimentosFiltrados = (selectedRegiao && selectedRegiao !== "all")
        ? investimentosData?.filter((inv: any) => inv.regiao === selectedRegiao)
        : investimentosData;

      let totalInvestimento = 0;
      if (investimentosFiltrados && investimentosFiltrados.length > 0) {
        totalInvestimento = investimentosFiltrados.reduce((total: number, inv: any) =>
          total + Number(inv.investimento_google_ads || 0) +
                  Number(inv.investimento_meta_ads || 0) +
                  Number(inv.investimento_linkedin_ads || 0) +
                  Number(inv.outros_investimentos || 0), 0);
      }

      // Buscar vendas FATURADAS usando helper
      const allVendas = await fetchVendasFaturadas(startDate, endDate);

      // Aplicar filtros manualmente
      let vendasData = allVendas;
      
      if (selectedRegiao && selectedRegiao !== "all") {
        vendasData = vendasData.filter((v: any) => v.estado === selectedRegiao);
      }

      const totalVendas = vendasData?.reduce((sum: number, venda: any) => sum + (Number(venda.valor_venda || 0) - Number(venda.valor_frete || 0)), 0) || 0;
      const vendasConvertidas = vendasData?.length || 0;
      
      // ROI e CAC só são calculados quando há investimentos no período
      const roi = totalInvestimento > 0 ? ((totalVendas - totalInvestimento) / totalInvestimento) * 100 : null;
      const cac = (totalInvestimento > 0 && vendasConvertidas > 0) ? totalInvestimento / vendasConvertidas : null;

      setMetrics({
        totalInvestimento,
        totalVendas,
        roi,
        cac,
        vendasConvertidas
      });
    } catch (error) {
      console.error("Erro ao calcular métricas:", error);
    }
  };

  const fetchCoresMaisVendidas = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = format(dateRange.to, "yyyy-MM-dd");

      let query = supabase
        .from("produtos_vendas")
        .select("cor_id, quantidade, vendas!inner(data_venda, estado, id)")
        .gte("vendas.data_venda", startDate)
        .lte("vendas.data_venda", endDate)
        .not("cor_id", "is", null);

      const { data: produtosData, error } = await query;

      if (error) {
        console.error("Erro ao buscar cores:", error);
        return;
      }

      // Filtrar por região se necessário
      let filteredData = produtosData || [];
      if (selectedRegiao && selectedRegiao !== "all") {
        filteredData = filteredData.filter((p: any) => p.vendas?.estado === selectedRegiao);
      }

      // Buscar nomes das cores
      const coresIds = [...new Set(filteredData.map((p: any) => p.cor_id))];
      const { data: coresData } = await supabase
        .from("catalogo_cores")
        .select("id, nome")
        .in("id", coresIds);

      // Agrupar por cor
      const coresMap = new Map();
      filteredData.forEach((p: any) => {
        const corNome = coresData?.find(c => c.id === p.cor_id)?.nome || "Sem cor";
        const current = coresMap.get(corNome) || 0;
        coresMap.set(corNome, current + (p.quantidade || 1));
      });

      // Encontrar a cor mais vendida
      let maxCor = null;
      let maxQtd = 0;
      coresMap.forEach((qtd, cor) => {
        if (qtd > maxQtd) {
          maxQtd = qtd;
          maxCor = cor;
        }
      });

      setCorMaisVendida(maxCor ? { cor: maxCor, quantidade: maxQtd } : null);
    } catch (error) {
      console.error("Erro ao buscar cores mais vendidas:", error);
    }
  };

  const fetchProdutosMaisVendidos = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = format(dateRange.to, "yyyy-MM-dd");

      let query = supabase
        .from("produtos_vendas")
        .select("descricao, quantidade, vendas!inner(data_venda, estado, id)")
        .gte("vendas.data_venda", startDate)
        .lte("vendas.data_venda", endDate);

      const { data: produtosData, error } = await query;

      if (error) {
        console.error("Erro ao buscar produtos:", error);
        return;
      }

      // Filtrar por região se necessário
      let filteredData = produtosData || [];
      if (selectedRegiao && selectedRegiao !== "all") {
        filteredData = filteredData.filter((p: any) => p.vendas?.estado === selectedRegiao);
      }

      // Agrupar por produto
      const produtosMap = new Map();
      filteredData.forEach((p: any) => {
        const produtoNome = p.descricao || "Produto sem nome";
        const current = produtosMap.get(produtoNome) || 0;
        produtosMap.set(produtoNome, current + (p.quantidade || 1));
      });

      // Encontrar o produto mais vendido
      let maxProduto = null;
      let maxQtd = 0;
      produtosMap.forEach((qtd, produto) => {
        if (qtd > maxQtd) {
          maxQtd = qtd;
          maxProduto = produto;
        }
      });

      setProdutoMaisVendido(maxProduto ? { produto: maxProduto, quantidade: maxQtd } : null);
    } catch (error) {
      console.error("Erro ao buscar produtos mais vendidos:", error);
    }
  };

  const fetchChartData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    try {
      const { data: allVendas, error } = await supabase
        .from("vendas")
        .select(`
          valor_venda, valor_frete, publico_alvo, canal_aquisicao_id, atendente_id, estado, data_venda, custo_total,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
          )
        `);

      if (error) throw error;

      // Filtrar manualmente para evitar erro de tipos profundos (TODAS as vendas)
      let vendasData = (allVendas || []).filter((v: any) => 
        v.data_venda >= startDate &&
        v.data_venda <= endDate
      );

      if (selectedRegiao && selectedRegiao !== "all") {
        vendasData = vendasData.filter((v: any) => v.estado === selectedRegiao);
      }

      if (vendasData) {
        const publicoAlvoMap = new Map<string, { value: number; vendas: number }>();
        
        vendasData.forEach((venda: any) => {
          const publico = venda.publico_alvo || 'Não informado';
          const current = publicoAlvoMap.get(publico) || { value: 0, vendas: 0 };
          publicoAlvoMap.set(publico, {
            value: current.value + (Number(venda.valor_venda || 0) - Number(venda.valor_frete || 0)),
            vendas: current.vendas + 1
          });
        });

        const publicoData = Array.from(publicoAlvoMap.entries()).map(([name, data]) => ({
          name,
          value: data.value,
          vendas: data.vendas
        }));

        const canalMap = new Map<string, { value: number; vendas: number }>();
        
        vendasData.forEach((venda: any) => {
          const canal = venda.canais_aquisicao?.nome || 'Não informado';
          const current = canalMap.get(canal) || { value: 0, vendas: 0 };
          canalMap.set(canal, {
            value: current.value + (Number(venda.valor_venda || 0) - Number(venda.valor_frete || 0)),
            vendas: current.vendas + 1
          });
        });

        const canalData = Array.from(canalMap.entries()).map(([name, data]) => ({
          name,
          value: data.value,
          vendas: data.vendas
        }));

        setPublicoAlvoData(publicoData);
        setCanalAquisicaoData(canalData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados dos gráficos:', error);
    }
  };

  const fetchRegionPerformance = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    try {
      const { data: allVendas, error: vendasError } = await supabase
        .from("vendas")
        .select("valor_venda, valor_frete, estado, custo_total, atendente_id, canal_aquisicao_id, data_venda");

      if (vendasError) throw vendasError;

      // Filtrar manualmente para evitar erro de tipos profundos (TODAS as vendas)
      let vendasData = (allVendas || []).filter((v: any) => 
        v.data_venda >= startDate &&
        v.data_venda <= endDate &&
        v.estado !== null
      );

      if (selectedRegiao && selectedRegiao !== "all") {
        vendasData = vendasData.filter((v: any) => v.estado === selectedRegiao);
      }

      let investimentosQuery = supabase
        .from("marketing_investimentos")
        .select("*")
        .gte("mes", format(dateRange.from, "yyyy-MM") + "-01")
        .lte("mes", format(dateRange.to, "yyyy-MM") + "-01");

      if (selectedRegiao && selectedRegiao !== "all") {
        investimentosQuery = investimentosQuery.eq("regiao", selectedRegiao);
      }

      const { data: investimentosData } = await investimentosQuery;

      const regionMap = new Map<string, RegionPerformanceData>();

      vendasData?.forEach((venda: any) => {
        const regiao = venda.estado;
        if (!regionMap.has(regiao)) {
          regionMap.set(regiao, {
            regiao,
            investimento: 0,
            faturamento: 0,
            vendas: 0,
            lucro: 0,
            cac: 0,
            ticketMedio: 0,
            roi: 0
          });
        }
        const regionData = regionMap.get(regiao)!;
        regionData.faturamento += Number(venda.valor_venda || 0) - Number(venda.valor_frete || 0);
        regionData.vendas += 1;
        regionData.lucro += (Number(venda.valor_venda || 0) - Number(venda.valor_frete || 0)) - Number(venda.custo_total || 0);
      });

      investimentosData?.forEach(inv => {
        const regiao = inv.regiao || 'Geral';
        if (!regionMap.has(regiao)) {
          regionMap.set(regiao, {
            regiao,
            investimento: 0,
            faturamento: 0,
            vendas: 0,
            lucro: 0,
            cac: 0,
            ticketMedio: 0,
            roi: 0
          });
        }
        const regionData = regionMap.get(regiao)!;
        regionData.investimento += 
          Number(inv.investimento_google_ads || 0) +
          Number(inv.investimento_meta_ads || 0) +
          Number(inv.investimento_linkedin_ads || 0) +
          Number(inv.outros_investimentos || 0);
      });

      regionMap.forEach((data, regiao) => {
        // CAC e ROI só calculados quando há investimento
        data.cac = (data.investimento > 0 && data.vendas > 0) ? data.investimento / data.vendas : 0;
        data.ticketMedio = data.vendas > 0 ? data.faturamento / data.vendas : 0;
        data.roi = data.investimento > 0 ? ((data.faturamento - data.investimento) / data.investimento) * 100 : 0;
      });

      setRegionPerformanceData(Array.from(regionMap.values()));
    } catch (error) {
      console.error('Erro ao buscar performance por região:', error);
    }
  };

  const handleAddInvestment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const investmentData = {
        ...newInvestment,
        regiao: newInvestment.regiao === "geral" ? null : newInvestment.regiao,
        created_by: user.id
      };

      const { error } = await supabase
        .from("marketing_investimentos")
        .insert([investmentData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Investimento adicionado com sucesso"
      });

      setDialogOpen(false);
      fetchInvestimentos();
      fetchInvestimentosHistorico();
      fetchMetrics();
      setNewInvestment({
        mes: format(new Date(), "yyyy-MM"),
        regiao: "geral",
        investimento_google_ads: 0,
        investimento_meta_ads: 0,
        investimento_linkedin_ads: 0,
        outros_investimentos: 0,
        observacoes: ""
      });
    } catch (error) {
      console.error("Erro ao adicionar investimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar investimento",
        variant: "destructive"
      });
    }
  };

  const handleUpdateInvestment = async () => {
    if (!editingInvestimento) return;

    try {
      const { error } = await supabase
        .from("marketing_investimentos")
        .update({
          investimento_google_ads: editingInvestimento.investimento_google_ads,
          investimento_meta_ads: editingInvestimento.investimento_meta_ads,
          investimento_linkedin_ads: editingInvestimento.investimento_linkedin_ads,
          outros_investimentos: editingInvestimento.outros_investimentos,
          observacoes: editingInvestimento.observacoes,
          regiao: editingInvestimento.regiao === "geral" ? null : editingInvestimento.regiao
        })
        .eq("id", editingInvestimento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Investimento atualizado com sucesso"
      });

      setDialogOpen(false);
      setEditingInvestimento(null);
      fetchInvestimentos();
      fetchInvestimentosHistorico();
      fetchMetrics();
    } catch (error) {
      console.error("Erro ao atualizar investimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar investimento",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (investimento: MarketingInvestment) => {
    setEditingInvestimento({
      ...investimento,
      regiao: investimento.regiao || "geral"
    });
    setDialogOpen(true);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      {/* Filters Section */}
      <Card className="w-full">
        <CardContent className="p-2 sm:p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 sm:h-9 text-xs sm:text-sm px-2",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yy", { locale: ptBR })
                      )
                    ) : (
                      "Período"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedRegiao} onValueChange={setSelectedRegiao}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {regioes.filter(regiao => regiao && regiao.trim() !== '').map((regiao) => (
                  <SelectItem key={regiao} value={regiao}>
                    {regiao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Faturamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold break-words">
              R$ {metrics.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Cor Mais Vendida</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold break-words">
              {corMaisVendida ? corMaisVendida.cor : "-"}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {corMaisVendida ? `${corMaisVendida.quantidade} unidades` : "Nenhuma venda no período"}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Produto Mais Vendido</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold break-words">
              {produtoMaisVendido ? produtoMaisVendido.produto : "-"}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {produtoMaisVendido ? `${produtoMaisVendido.quantidade} unidades` : "Nenhuma venda no período"}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ticket Médio</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold break-words">
              {metrics.vendasConvertidas > 0 
                ? `R$ ${(metrics.totalVendas / metrics.vendasConvertidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : "R$ 0,00"
              }
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {metrics.vendasConvertidas} vendas no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <CardTitle className="text-sm sm:text-base">Vendas por Público Alvo</CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  checked={chartMode === 'faturamento'}
                  onCheckedChange={(checked) => setChartMode(checked ? 'faturamento' : 'quantidade')}
                />
                <Label className="text-xs sm:text-sm whitespace-nowrap">
                  {chartMode === 'quantidade' ? 'Qtd.' : 'Valor'}
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            {publicoAlvoData && publicoAlvoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <PieChart>
                  <Pie
                    data={publicoAlvoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => 
                      chartMode === 'quantidade' 
                        ? `${entry.vendas}`
                        : `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    }
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey={chartMode === 'quantidade' ? 'vendas' : 'value'}
                  >
                    {publicoAlvoData.map((entry, index) => (
                      <Cell key={`publico-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => {
                      if (chartMode === 'quantidade') {
                        return [`${value} vendas`, props.payload.name];
                      } else {
                        return [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, props.payload.name];
                      }
                    }}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground text-xs sm:text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Vendas por Canal de Aquisição</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            {canalAquisicaoData && canalAquisicaoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <PieChart>
                  <Pie
                    data={canalAquisicaoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => 
                      chartMode === 'quantidade' 
                        ? `${entry.vendas}`
                        : `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    }
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey={chartMode === 'quantidade' ? 'vendas' : 'value'}
                  >
                    {canalAquisicaoData.map((entry, index) => (
                      <Cell key={`canal-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => {
                      if (chartMode === 'quantidade') {
                        return [`${value} vendas`, props.payload.name];
                      } else {
                        return [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, props.payload.name];
                      }
                    }}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground text-xs sm:text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Region Performance Table */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Performance por Região</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Análise detalhada por estado</CardDescription>
        </CardHeader>
        <CardContent>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Região</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Investimento</TableHead>
                  <TableHead className="text-xs">Faturamento</TableHead>
                  <TableHead className="text-xs">Vendas</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Lucro</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">CAC</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Ticket Médio</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionPerformanceData.map((region) => (
                  <TableRow key={region.regiao}>
                    <TableCell className="font-medium text-xs sm:text-sm">{region.regiao}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                      R$ {region.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      R$ {region.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{region.vendas}</TableCell>
                    <TableCell className={cn("text-xs sm:text-sm hidden sm:table-cell", region.lucro >= 0 ? 'text-green-600' : 'text-red-600')}>
                      R$ {region.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                     <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                       {region.cac > 0 ? `R$ ${region.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "-"}
                     </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                      R$ {region.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                     <TableCell className={cn("text-xs sm:text-sm hidden sm:table-cell", region.roi >= 0 ? 'text-green-600' : 'text-red-600')}>
                       {region.investimento > 0 ? `${region.roi.toFixed(2)}%` : "-"}
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Additional Metrics Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Resumo de Vendas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Dados do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Vendas Realizadas:</span>
              <span className="font-medium">{metrics.vendasConvertidas}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Ticket Médio:</span>
              <span className="font-medium break-words">
                R$ {metrics.vendasConvertidas > 0 ? 
                  (metrics.totalVendas / metrics.vendasConvertidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 
                  '0,00'}
              </span>
            </div>
            {metrics.cac !== null && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span>CAC Médio:</span>
                <span className="font-medium break-words">
                  R$ {metrics.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Investment History with Add/Edit Dialog */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <CardTitle className="text-base sm:text-lg">Histórico de Investimentos</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Últimos investimentos registrados
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditingInvestimento(null);
                  setNewInvestment({
                    mes: format(new Date(), "yyyy-MM"),
                    regiao: "",
                    investimento_google_ads: 0,
                    investimento_meta_ads: 0,
                    investimento_linkedin_ads: 0,
                    outros_investimentos: 0,
                    observacoes: ""
                  });
                }}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingInvestimento ? 'Editar Investimento' : 'Novo Investimento'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Input
                    type="month"
                    value={editingInvestimento?.mes.substring(0, 7) || newInvestment.mes}
                    onChange={(e) => editingInvestimento 
                      ? setEditingInvestimento({...editingInvestimento, mes: e.target.value + '-01'})
                      : setNewInvestment({...newInvestment, mes: e.target.value})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Região (opcional)</Label>
                  <Select 
                    value={editingInvestimento?.regiao || newInvestment.regiao || "geral"}
                    onValueChange={(value) => editingInvestimento
                      ? setEditingInvestimento({...editingInvestimento, regiao: value})
                      : setNewInvestment({...newInvestment, regiao: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      {regioes.filter(regiao => regiao && regiao.trim() !== '').map((regiao) => (
                        <SelectItem key={regiao} value={regiao}>
                          {regiao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Google Ads</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvestimento?.investimento_google_ads || newInvestment.investimento_google_ads}
                    onChange={(e) => editingInvestimento
                      ? setEditingInvestimento({...editingInvestimento, investimento_google_ads: Number(e.target.value)})
                      : setNewInvestment({...newInvestment, investimento_google_ads: Number(e.target.value)})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Ads</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvestimento?.investimento_meta_ads || newInvestment.investimento_meta_ads}
                    onChange={(e) => editingInvestimento
                      ? setEditingInvestimento({...editingInvestimento, investimento_meta_ads: Number(e.target.value)})
                      : setNewInvestment({...newInvestment, investimento_meta_ads: Number(e.target.value)})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn Ads</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvestimento?.investimento_linkedin_ads || newInvestment.investimento_linkedin_ads}
                    onChange={(e) => editingInvestimento
                      ? setEditingInvestimento({...editingInvestimento, investimento_linkedin_ads: Number(e.target.value)})
                      : setNewInvestment({...newInvestment, investimento_linkedin_ads: Number(e.target.value)})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Outros Investimentos</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvestimento?.outros_investimentos || newInvestment.outros_investimentos}
                    onChange={(e) => editingInvestimento
                      ? setEditingInvestimento({...editingInvestimento, outros_investimentos: Number(e.target.value)})
                      : setNewInvestment({...newInvestment, outros_investimentos: Number(e.target.value)})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={editingInvestimento?.observacoes || newInvestment.observacoes}
                    onChange={(e) => editingInvestimento
                      ? setEditingInvestimento({...editingInvestimento, observacoes: e.target.value})
                      : setNewInvestment({...newInvestment, observacoes: e.target.value})
                    }
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={editingInvestimento ? handleUpdateInvestment : handleAddInvestment}
                >
                  {editingInvestimento ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {investimentosHistorico.map((investimento) => {
              const totalInvestimento = 
                Number(investimento.investimento_google_ads) +
                Number(investimento.investimento_meta_ads) +
                Number(investimento.investimento_linkedin_ads) +
                Number(investimento.outros_investimentos);
              const hasInvestimento = totalInvestimento > 0;

              return (
                <div 
                  key={investimento.id} 
                  className="flex items-center justify-between h-[50px] border-b last:border-b-0 px-2"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      hasInvestimento ? "bg-green-500" : "bg-yellow-500"
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {format(new Date(investimento.mes), "MMM/yyyy", { locale: ptBR })}
                        {investimento.regiao && (
                          <span className="text-xs text-muted-foreground ml-2">• {investimento.regiao}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-medium text-sm">
                      {hasInvestimento 
                        ? `R$ ${totalInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : "Não informado"
                      }
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(investimento)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
