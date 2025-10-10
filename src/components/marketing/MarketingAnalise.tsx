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
import { TrendingUp, DollarSign, Users, Target, Plus, Edit } from "lucide-react";
import { format, startOfYear, endOfYear } from "date-fns";
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
  roi: number;
  cac: number;
  taxaConversao: number;
  totalLeads: number;
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
    from: startOfYear(new Date()),
    to: endOfYear(new Date())
  });
  const [selectedVendedor, setSelectedVendedor] = useState<string>("all");
  const [selectedRegiao, setSelectedRegiao] = useState<string>("all");
  const [selectedCanalAquisicao, setSelectedCanalAquisicao] = useState<string>("all");
  const [investimentos, setInvestimentos] = useState<MarketingInvestment[]>([]);
  const [metrics, setMetrics] = useState<MarketingMetrics>({
    totalInvestimento: 0,
    totalVendas: 0,
    roi: 0,
    cac: 0,
    taxaConversao: 0,
    totalLeads: 0,
    vendasConvertidas: 0
  });
  const [vendedores, setVendedores] = useState<{ id: string; nome: string }[]>([]);
  const [regioes, setRegioes] = useState<string[]>([]);
  const [publicoAlvoData, setPublicoAlvoData] = useState<PublicoAlvoData[]>([]);
  const [canalAquisicaoData, setCanalAquisicaoData] = useState<CanalAquisicaoData[]>([]);
  const [regionPerformanceData, setRegionPerformanceData] = useState<RegionPerformanceData[]>([]);
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
        fetchRegionPerformance()
      ]);
    };
    
    loadMetrics();
    
    return () => {
      isMounted = false;
    };
  }, [selectedVendedor, selectedRegiao, selectedCanalAquisicao, dateRange]);

  // Helper para evitar erro de tipos profundos do Supabase
  const fetchVendasFaturadas = async (startDate: string, endDate: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select("valor_venda, custo_total, atendente_id, estado, canal_aquisicao_id, data_venda");
      
      if (error) throw error;
      
      // Filtrar manualmente para evitar erro de tipos profundos
      return (data || []).filter((v: any) => 
        v.status === "faturada" &&
        v.data_venda >= startDate &&
        v.data_venda <= endDate
      );
    } catch (error) {
      console.error("Erro ao buscar vendas faturadas:", error);
      return [];
    }
  };

  const fetchLeadsData = async (startDate: string, endDate: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from("elisaportas_leads")
        .select("id, atendente_id, endereco_estado, novo_status, canal_aquisicao_id, created_at");
      
      if (error) throw error;
      
      // Filtrar manualmente para evitar erro de tipos profundos
      return (data || []).filter((l: any) =>
        l.created_at >= startDate &&
        l.created_at <= endDate
      );
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvestimentos(),
        fetchVendedores(),
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

  const fetchVendedores = async () => {
    try {
      const { data, error }: any = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .eq("ativo", true);

      if (error) {
        console.error("Erro ao buscar vendedores:", error);
        return;
      }

      console.log("Vendedores encontrados:", data);
      setVendedores(data?.map((v: any) => ({ id: v.user_id, nome: v.nome })) || []);
    } catch (error) {
      console.error("Erro ao buscar vendedores:", error);
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

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    // Buscar investimentos
    const { data: investimentosData } = await (supabase
      .from("marketing_investimentos")
      .select("*")
      .gte("mes", format(dateRange.from, "yyyy-MM") + "-01")
      .lte("mes", format(dateRange.to, "yyyy-MM") + "-01") as any);

    // Filtrar por região se necessário
    const investimentosFiltrados = (selectedRegiao && selectedRegiao !== "all")
      ? investimentosData?.filter((inv: any) => inv.regiao === selectedRegiao)
      : investimentosData;

    let totalInvestimento = 0;
    const canalSelecionadoNome = canais.find(c => c.id === selectedCanalAquisicao)?.nome;
    if (investimentosFiltrados && investimentosFiltrados.length > 0) {
      if (selectedCanalAquisicao && canalSelecionadoNome) {
        const nomeLower = canalSelecionadoNome.toLowerCase();
        if (nomeLower.includes('google')) {
          totalInvestimento = investimentosFiltrados.reduce((total: number, inv: any) => total + Number(inv.investimento_google_ads || 0), 0);
        } else if (nomeLower.includes('meta')) {
          totalInvestimento = investimentosFiltrados.reduce((total: number, inv: any) => total + Number(inv.investimento_meta_ads || 0), 0);
        } else if (nomeLower.includes('linkedin')) {
          totalInvestimento = investimentosFiltrados.reduce((total: number, inv: any) => total + Number(inv.investimento_linkedin_ads || 0), 0);
        } else {
          totalInvestimento = investimentosFiltrados.reduce((total: number, inv: any) => total + Number(inv.outros_investimentos || 0), 0);
        }
      } else {
        totalInvestimento = investimentosFiltrados.reduce((total: number, inv: any) =>
          total + Number(inv.investimento_google_ads || 0) +
                  Number(inv.investimento_meta_ads || 0) +
                  Number(inv.investimento_linkedin_ads || 0) +
                  Number(inv.outros_investimentos || 0), 0);
      }
    }

    // Buscar vendas FATURADAS usando helper
    const allVendas = await fetchVendasFaturadas(startDate, endDate);

    // Aplicar filtros manualmente
    let vendasData = allVendas;
    
    if (selectedVendedor && selectedVendedor !== "all") {
      vendasData = vendasData.filter((v: any) => v.atendente_id === selectedVendedor);
    }
    
    if (selectedRegiao && selectedRegiao !== "all") {
      vendasData = vendasData.filter((v: any) => v.estado === selectedRegiao);
    }
    
    if (selectedCanalAquisicao && selectedCanalAquisicao !== "all") {
      vendasData = vendasData.filter((v: any) => v.canal_aquisicao_id === selectedCanalAquisicao);
    }

    // Buscar leads usando helper
    const allLeads = await fetchLeadsData(startDate, endDate);

    // Aplicar filtros aos leads
    let leadsData = allLeads;
    
    if (selectedCanalAquisicao && selectedCanalAquisicao !== "all") {
      leadsData = leadsData.filter((lead: any) => lead.canal_aquisicao_id === selectedCanalAquisicao);
    }
    
    if (selectedVendedor && selectedVendedor !== "all") {
      leadsData = leadsData.filter((lead: any) => lead.atendente_id === selectedVendedor);
    }
    
    if (selectedRegiao && selectedRegiao !== "all") {
      leadsData = leadsData.filter((lead: any) => lead.endereco_estado === selectedRegiao);
    }

    const totalVendas = vendasData?.reduce((sum: number, venda: any) => sum + Number(venda.valor_venda), 0) || 0;
    const totalLeads = leadsData?.length || 0;
    const vendasConvertidas = vendasData?.length || 0;
    const taxaConversao = totalLeads > 0 ? (vendasConvertidas / totalLeads) * 100 : 0;
    const roi = totalInvestimento > 0 ? ((totalVendas - totalInvestimento) / totalInvestimento) * 100 : 0;
    const cac = vendasConvertidas > 0 ? totalInvestimento / vendasConvertidas : 0;

    setMetrics({
      totalInvestimento,
      totalVendas,
      roi,
      cac,
      taxaConversao,
      totalLeads,
      vendasConvertidas
    });
  };

  const fetchChartData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    try {
      const { data: allVendas, error } = await supabase
        .from("vendas")
        .select(`
          valor_venda, publico_alvo, canal_aquisicao_id, atendente_id, estado, data_venda, status,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
          )
        `);

      if (error) throw error;

      // Filtrar manualmente para evitar erro de tipos profundos
      let vendasData = (allVendas || []).filter((v: any) => 
        v.status === "faturada" &&
        v.data_venda >= startDate &&
        v.data_venda <= endDate
      );

      if (selectedVendedor && selectedVendedor !== "all") {
        vendasData = vendasData.filter((v: any) => v.atendente_id === selectedVendedor);
      }

      if (selectedRegiao && selectedRegiao !== "all") {
        vendasData = vendasData.filter((v: any) => v.estado === selectedRegiao);
      }

      if (selectedCanalAquisicao && selectedCanalAquisicao !== "all") {
        vendasData = vendasData.filter((v: any) => v.canal_aquisicao_id === selectedCanalAquisicao);
      }

      if (vendasData) {
        const publicoAlvoMap = new Map<string, { value: number; vendas: number }>();
        
        vendasData.forEach((venda: any) => {
          const publico = venda.publico_alvo || 'Não informado';
          const current = publicoAlvoMap.get(publico) || { value: 0, vendas: 0 };
          publicoAlvoMap.set(publico, {
            value: current.value + venda.valor_venda,
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
            value: current.value + venda.valor_venda,
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
        .select("valor_venda, estado, custo_total, atendente_id, canal_aquisicao_id, data_venda, status");

      if (vendasError) throw vendasError;

      // Filtrar manualmente para evitar erro de tipos profundos
      let vendasData = (allVendas || []).filter((v: any) => 
        v.status === "faturada" &&
        v.data_venda >= startDate &&
        v.data_venda <= endDate &&
        v.estado !== null
      );

      if (selectedCanalAquisicao && selectedCanalAquisicao !== "all") {
        vendasData = vendasData.filter((v: any) => v.canal_aquisicao_id === selectedCanalAquisicao);
      }

      if (selectedVendedor && selectedVendedor !== "all") {
        vendasData = vendasData.filter((v: any) => v.atendente_id === selectedVendedor);
      }

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
        regionData.faturamento += Number(venda.valor_venda);
        regionData.vendas += 1;
        regionData.lucro += Number(venda.valor_venda) - Number(venda.custo_total || 0);
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
        data.cac = data.vendas > 0 ? data.investimento / data.vendas : 0;
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
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione os filtros para análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione o período</span>
                    )}
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
            </div>

            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Região</Label>
              <Select value={selectedRegiao} onValueChange={setSelectedRegiao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {regioes.map((regiao) => (
                    <SelectItem key={regiao} value={regiao}>
                      {regiao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Canal de Aquisição</Label>
              <Select value={selectedCanalAquisicao} onValueChange={setSelectedCanalAquisicao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {canais.map((canal) => (
                    <SelectItem key={canal.id} value={canal.id}>
                      {canal.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.totalInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.roi.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.taxaConversao.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.vendasConvertidas} de {metrics.totalLeads} leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendas por Público Alvo</CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  checked={chartMode === 'faturamento'}
                  onCheckedChange={(checked) => setChartMode(checked ? 'faturamento' : 'quantidade')}
                />
                <Label className="text-sm">
                  {chartMode === 'quantidade' ? 'Quantidade' : 'Faturamento'}
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {publicoAlvoData && publicoAlvoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={publicoAlvoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => 
                      chartMode === 'quantidade' 
                        ? `${entry.vendas} vendas`
                        : `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                    }
                    outerRadius={80}
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
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Canal de Aquisição</CardTitle>
          </CardHeader>
          <CardContent>
            {canalAquisicaoData && canalAquisicaoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={canalAquisicaoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => 
                      chartMode === 'quantidade' 
                        ? `${entry.vendas} vendas`
                        : `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                    }
                    outerRadius={80}
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
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Region Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Região</CardTitle>
          <CardDescription>Análise detalhada por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Região</TableHead>
                <TableHead>Investimento</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>CAC</TableHead>
                <TableHead>Ticket Médio</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regionPerformanceData.map((region) => (
                <TableRow key={region.regiao}>
                  <TableCell className="font-medium">{region.regiao}</TableCell>
                  <TableCell>
                    R$ {region.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    R$ {region.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{region.vendas}</TableCell>
                  <TableCell className={region.lucro >= 0 ? 'text-green-600' : 'text-red-600'}>
                    R$ {region.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    R$ {region.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    R$ {region.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={region.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {region.roi.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CAC (Custo de Aquisição de Cliente)</CardTitle>
            <CardDescription>
              Custo médio por cliente adquirido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {metrics.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Canal</CardTitle>
            <CardDescription>
              Dados do período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total de Leads:</span>
                <span className="font-medium">{metrics.totalLeads}</span>
              </div>
              <div className="flex justify-between">
                <span>Vendas Convertidas:</span>
                <span className="font-medium">{metrics.vendasConvertidas}</span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Médio:</span>
                <span className="font-medium">
                  R$ {metrics.vendasConvertidas > 0 ? 
                    (metrics.totalVendas / metrics.vendasConvertidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 
                    '0,00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment History with Add/Edit Dialog */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Histórico de Investimentos</CardTitle>
            <CardDescription>
              Últimos investimentos registrados
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
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
                Adicionar Investimento
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
                      {regioes.map((regiao) => (
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
          <div className="space-y-4">
            {investimentos.slice(0, 10).map((investimento) => (
              <div key={investimento.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">
                    {format(new Date(investimento.mes), "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {investimento.regiao && (
                    <p className="text-sm text-muted-foreground">{investimento.regiao}</p>
                  )}
                  {investimento.observacoes && (
                    <p className="text-sm text-muted-foreground">{investimento.observacoes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {(
                        Number(investimento.investimento_google_ads) +
                        Number(investimento.investimento_meta_ads) +
                        Number(investimento.investimento_linkedin_ads) +
                        Number(investimento.outros_investimentos)
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {Number(investimento.investimento_google_ads) > 0 && (
                        <div>Google: R$ {Number(investimento.investimento_google_ads).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      )}
                      {Number(investimento.investimento_meta_ads) > 0 && (
                        <div>Meta: R$ {Number(investimento.investimento_meta_ads).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      )}
                      {Number(investimento.investimento_linkedin_ads) > 0 && (
                        <div>LinkedIn: R$ {Number(investimento.investimento_linkedin_ads).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      )}
                      {Number(investimento.outros_investimentos) > 0 && (
                        <div>Outros: R$ {Number(investimento.outros_investimentos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(investimento)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
