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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Users, Target, Plus, BarChart3, Edit } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
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

interface VendaData {
  valor_venda: number;
  atendente_id: string;
  estado: string;
  canal_aquisicao_id: string;
  publico_alvo: string;
  data_venda: string;
  canais_aquisicao?: {
    id: string;
    nome: string;
  };
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

export default function Marketing() {
  const { isAdmin, isGerenteComercial } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date())
  });
  const [selectedVendedor, setSelectedVendedor] = useState<string>("");
  const [selectedRegiao, setSelectedRegiao] = useState<string>("");
  const [selectedCanalAquisicao, setSelectedCanalAquisicao] = useState<string>("");
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
    regiao: "",
    investimento_google_ads: 0,
    investimento_meta_ads: 0,
    investimento_linkedin_ads: 0,
    outros_investimentos: 0,
    observacoes: ""
  });

  // Verificar permissões
  if (!isAdmin && !isGerenteComercial) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground mb-4">
            Acesso Restrito
          </h1>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar esta página.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchChartData();
    fetchRegionPerformance();
  }, [selectedVendedor, selectedRegiao, selectedCanalAquisicao, dateRange]);

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
      console.log("Buscando investimentos para período:", dateRange.from, "a", dateRange.to);
      
      let query = supabase
        .from("marketing_investimentos")
        .select("*")
        .order("mes", { ascending: false });

      if (dateRange?.from && dateRange?.to) {
        const startMonth = format(dateRange.from, "yyyy-MM") + "-01";
        const endMonth = format(dateRange.to, "yyyy-MM") + "-01";
        console.log("Filtrando investimentos entre:", startMonth, "e", endMonth);
        query = query.gte("mes", startMonth).lte("mes", endMonth);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar investimentos:", error);
        setInvestimentos([]);
        return;
      }
      
      console.log("Dados de investimentos encontrados:", data);
      setInvestimentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar investimentos:", error);
      setInvestimentos([]);
    }
  };

  const fetchVendedores = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .eq("ativo", true);

      if (error) {
        console.error("Erro ao buscar vendedores:", error);
        setVendedores([]);
        return;
      }

      console.log("Vendedores encontrados:", data);
      setVendedores(data?.map(v => ({ id: v.user_id, nome: v.nome })) || []);
    } catch (error) {
      console.error("Erro ao buscar vendedores:", error);
      setVendedores([]);
    }
  };

  const fetchRegioes = async () => {
    const { data, error } = await supabase
      .from("vendas")
      .select("estado")
      .not("estado", "is", null);

    if (error) throw error;
    const regionesUnicas = [...new Set(data?.map(v => v.estado))];
    setRegioes(regionesUnicas);
  };

  const fetchMetrics = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    console.log("Buscando métricas para período:", startDate, "a", endDate);
    console.log("Filtros aplicados:", { selectedVendedor, selectedRegiao, selectedCanalAquisicao });

    // Buscar investimentos do período aplicando filtros
    let investimentosQuery = supabase
      .from("marketing_investimentos")
      .select("*")
      .gte("mes", format(dateRange.from, "yyyy-MM") + "-01")
      .lte("mes", format(dateRange.to, "yyyy-MM") + "-01");

    // Aplicar filtro de região nos investimentos
    if (selectedRegiao) {
      investimentosQuery = investimentosQuery.eq("regiao", selectedRegiao);
    }

    const { data: investimentosData, error: investError } = await investimentosQuery;
    
    console.log("Dados de investimentos encontrados:", investimentosData);
    if (investError) console.error("Erro ao buscar investimentos:", investError);

    let totalInvestimento = 0;
    const canalSelecionadoNome = canais.find(c => c.id === selectedCanalAquisicao)?.nome;
    if (investimentosData && investimentosData.length > 0) {
      if (selectedCanalAquisicao && canalSelecionadoNome) {
        const nomeLower = canalSelecionadoNome.toLowerCase();
        if (nomeLower.includes('google')) {
          totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.investimento_google_ads || 0), 0);
        } else if (nomeLower.includes('meta')) {
          totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.investimento_meta_ads || 0), 0);
        } else if (nomeLower.includes('linkedin')) {
          totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.investimento_linkedin_ads || 0), 0);
        } else {
          totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.outros_investimentos || 0), 0);
        }
      } else {
        totalInvestimento = investimentosData.reduce((total, inv) =>
          total + Number(inv.investimento_google_ads || 0) +
                  Number(inv.investimento_meta_ads || 0) +
                  Number(inv.investimento_linkedin_ads || 0) +
                  Number(inv.outros_investimentos || 0), 0);
      }
    }
    
    console.log("Total de investimento calculado:", totalInvestimento);

    // Buscar vendas do período
    let vendasQuery = supabase
      .from("vendas")
      .select(`
        valor_venda, atendente_id, estado, canal_aquisicao_id, data_venda,
        canais_aquisicao:canal_aquisicao_id (
          id,
          nome
        )
      `)
      .gte("data_venda", startDate)
      .lte("data_venda", endDate);

    if (selectedCanalAquisicao) {
      vendasQuery = vendasQuery.eq("canal_aquisicao_id", selectedCanalAquisicao);
    } else {
      // Buscar IDs dos canais Google e Meta se nenhum canal específico selecionado
      const { data: canaisGoogleMeta } = await supabase
        .from("canais_aquisicao")
        .select("id")
        .in("nome", ["Google", "Meta (Facebook/Instagram)"]);
      
      const idsGoogleMeta = canaisGoogleMeta?.map(c => c.id) || [];
      
      // Filtrar vendas apenas dos canais Google e Meta para cálculo do CAC
      if (idsGoogleMeta.length > 0) {
        vendasQuery = vendasQuery.in("canal_aquisicao_id", idsGoogleMeta);
      }
    }

    if (selectedVendedor) {
      vendasQuery = vendasQuery.eq("atendente_id", selectedVendedor);
    }

    if (selectedRegiao) {
      vendasQuery = vendasQuery.eq("estado", selectedRegiao);
    }

    const { data: vendasData, error: vendasError } = await vendasQuery;
    
    console.log("Dados de vendas encontrados:", vendasData);
    if (vendasError) console.error("Erro ao buscar vendas:", vendasError);

    // Buscar leads do período
    let leadsQuery = supabase
      .from("elisaportas_leads")
      .select("id, atendente_id, endereco_estado, novo_status, canal_aquisicao_id")
      .gte("created_at", startDate)
      .lte("created_at", endDate);
    
    if (selectedCanalAquisicao) {
      leadsQuery = leadsQuery.eq("canal_aquisicao_id", selectedCanalAquisicao);
    } else {
      // Buscar IDs dos canais Google e Meta se nenhum canal específico selecionado
      const { data: canaisGoogleMeta } = await supabase
        .from("canais_aquisicao")
        .select("id")
        .in("nome", ["Google", "Meta (Facebook/Instagram)"]);
      
      const idsGoogleMeta = canaisGoogleMeta?.map(c => c.id) || [];
      
      // Filtrar leads apenas dos canais Google e Meta
      if (idsGoogleMeta.length > 0) {
        leadsQuery = leadsQuery.in("canal_aquisicao_id", idsGoogleMeta);
      }
    }

    if (selectedVendedor) {
      leadsQuery = leadsQuery.eq("atendente_id", selectedVendedor);
    }

    if (selectedRegiao) {
      leadsQuery = leadsQuery.eq("endereco_estado", selectedRegiao);
    }

    const { data: leadsData, error: leadsError } = await leadsQuery;
    
    console.log("Dados de leads encontrados:", leadsData);
    if (leadsError) console.error("Erro ao buscar leads:", leadsError);

    const totalVendas = vendasData?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0;
    const totalLeads = leadsData?.length || 0;
    const vendasConvertidas = vendasData?.length || 0;
    const taxaConversao = totalLeads > 0 ? (vendasConvertidas / totalLeads) * 100 : 0;
    const roi = totalInvestimento > 0 ? ((totalVendas - totalInvestimento) / totalInvestimento) * 100 : 0;
    const cac = vendasConvertidas > 0 ? totalInvestimento / vendasConvertidas : 0;

    console.log("Métricas calculadas:", {
      totalInvestimento,
      totalVendas,
      roi,
      cac,
      taxaConversao,
      totalLeads,
      vendasConvertidas
    });

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
      let vendasQuery = supabase
        .from("vendas")
        .select(`
          valor_venda, publico_alvo, canal_aquisicao_id,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
          )
        `)
        .gte("data_venda", startDate)
        .lte("data_venda", endDate);

      if (selectedVendedor) {
        vendasQuery = vendasQuery.eq("atendente_id", selectedVendedor);
      }

      if (selectedRegiao) {
        vendasQuery = vendasQuery.eq("estado", selectedRegiao);
      }

      if (selectedCanalAquisicao) {
        vendasQuery = vendasQuery.eq("canal_aquisicao_id", selectedCanalAquisicao);
      }

      const { data: vendasData } = await vendasQuery;

      if (vendasData) {
        // Processar dados de público alvo
        const publicoAlvoMap = new Map<string, { value: number; vendas: number }>();
        
        vendasData.forEach(venda => {
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

        // Processar dados de canal de aquisição
        const canalMap = new Map<string, { value: number; vendas: number }>();
        
        vendasData.forEach(venda => {
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
      // Buscar vendas por região aplicando todos os filtros
      let vendasQuery = supabase
        .from("vendas")
        .select("valor_venda, estado, custo_produto, custo_pintura, atendente_id, canal_aquisicao_id")
        .gte("data_venda", startDate)
        .lte("data_venda", endDate)
        .not("estado", "is", null);

      if (selectedCanalAquisicao) {
        vendasQuery = vendasQuery.eq("canal_aquisicao_id", selectedCanalAquisicao);
      }

      if (selectedVendedor) {
        vendasQuery = vendasQuery.eq("atendente_id", selectedVendedor);
      }

      if (selectedRegiao) {
        vendasQuery = vendasQuery.eq("estado", selectedRegiao);
      }

      const { data: vendasData } = await vendasQuery;

      // Buscar investimentos do período aplicando filtro de região
      let investimentosQuery = supabase
        .from("marketing_investimentos")
        .select("*")
        .gte("mes", format(dateRange.from, "yyyy-MM") + "-01")
        .lte("mes", format(dateRange.to, "yyyy-MM") + "-01");

      if (selectedRegiao) {
        investimentosQuery = investimentosQuery.eq("regiao", selectedRegiao);
      }

      const { data: investimentosData } = await investimentosQuery;

      // Processar dados por região
      const regionMap = new Map<string, RegionPerformanceData>();

      // Inicializar com todas as regiões
      regioes.forEach(regiao => {
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
      });

      // Adicionar dados de vendas
      vendasData?.forEach(venda => {
        if (!venda.estado) return;
        
        const current = regionMap.get(venda.estado) || {
          regiao: venda.estado,
          investimento: 0,
          faturamento: 0,
          vendas: 0,
          lucro: 0,
          cac: 0,
          ticketMedio: 0,
          roi: 0
        };

        const custo = (venda.custo_produto || 0) + (venda.custo_pintura || 0);
        const lucroVenda = venda.valor_venda - custo;

        regionMap.set(venda.estado, {
          ...current,
          faturamento: current.faturamento + venda.valor_venda,
          vendas: current.vendas + 1,
          lucro: current.lucro + lucroVenda
        });
      });

      // Distribuir investimentos consolidados entre regiões
      let totalInvestimento = 0;
      const canalSelecionadoNome = canais.find(c => c.id === selectedCanalAquisicao)?.nome;
      if (investimentosData && investimentosData.length > 0) {
        if (selectedCanalAquisicao && canalSelecionadoNome) {
          const nomeLower = canalSelecionadoNome.toLowerCase();
          if (nomeLower.includes('google')) {
            totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.investimento_google_ads || 0), 0);
          } else if (nomeLower.includes('meta')) {
            totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.investimento_meta_ads || 0), 0);
          } else if (nomeLower.includes('linkedin')) {
            totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.investimento_linkedin_ads || 0), 0);
          } else {
            totalInvestimento = investimentosData.reduce((total, inv) => total + Number(inv.outros_investimentos || 0), 0);
          }
        } else {
          totalInvestimento = investimentosData.reduce((total, inv) =>
            total + Number(inv.investimento_google_ads || 0) +
                    Number(inv.investimento_meta_ads || 0) +
                    Number(inv.investimento_linkedin_ads || 0) +
                    Number(inv.outros_investimentos || 0), 0);
        }
      }

      // Distribuir proporcionalmente entre regiões baseado no faturamento
      const totalFaturamento = Array.from(regionMap.values()).reduce((sum, region) => sum + region.faturamento, 0);
      
      regionMap.forEach((region, regiao) => {
        if (totalFaturamento > 0) {
          const proporcao = region.faturamento / totalFaturamento;
          const investimentoRegiao = totalInvestimento * proporcao;
          
          regionMap.set(regiao, {
            ...region,
            investimento: investimentoRegiao
          });
        }
      });

      // Calcular métricas finais
      const regionData = Array.from(regionMap.values()).map(data => ({
        ...data,
        ticketMedio: data.vendas > 0 ? data.faturamento / data.vendas : 0,
        cac: data.vendas > 0 ? data.investimento / data.vendas : 0,
        roi: data.investimento > 0 ? ((data.faturamento - data.investimento) / data.investimento) * 100 : 0
      })).filter(data => data.faturamento > 0 || data.investimento > 0);

      setRegionPerformanceData(regionData);
    } catch (error) {
      console.error('Erro ao buscar performance por região:', error);
    }
  };

  const handleSaveInvestment = async () => {
    try {
      const userData = await supabase.auth.getUser();
      const investimentoData = {
        mes: newInvestment.mes + "-01",
        regiao: newInvestment.regiao || null,
        investimento_google_ads: newInvestment.investimento_google_ads,
        investimento_meta_ads: newInvestment.investimento_meta_ads,
        investimento_linkedin_ads: newInvestment.investimento_linkedin_ads,
        outros_investimentos: newInvestment.outros_investimentos,
        observacoes: newInvestment.observacoes,
        created_by: userData.data.user?.id
      };

      let error;
      if (editingInvestimento) {
        const { error: updateError } = await supabase
          .from("marketing_investimentos")
          .update(investimentoData)
          .eq("id", editingInvestimento.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("marketing_investimentos")
          .insert(investimentoData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Investimento ${editingInvestimento ? 'atualizado' : 'salvo'} com sucesso`,
      });

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar investimento",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewInvestment({
      mes: format(new Date(), "yyyy-MM"),
      regiao: "",
      investimento_google_ads: 0,
      investimento_meta_ads: 0,
      investimento_linkedin_ads: 0,
      outros_investimentos: 0,
      observacoes: ""
    });
    setEditingInvestimento(null);
  };

  const handleEdit = (investimento: MarketingInvestment) => {
    setEditingInvestimento(investimento);
    setNewInvestment({
      mes: investimento.mes.slice(0, 7),
      regiao: investimento.regiao || "",
      investimento_google_ads: Number(investimento.investimento_google_ads) || 0,
      investimento_meta_ads: Number(investimento.investimento_meta_ads) || 0,
      investimento_linkedin_ads: Number(investimento.investimento_linkedin_ads) || 0,
      outros_investimentos: Number(investimento.outros_investimentos) || 0,
      observacoes: investimento.observacoes || ""
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">
            Análise de performance e investimentos em marketing
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInvestimento ? 'Editar' : 'Adicionar'} Investimento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mes">Mês</Label>
                <Input
                  id="mes"
                  type="month"
                  value={newInvestment.mes}
                  onChange={(e) => setNewInvestment({ ...newInvestment, mes: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="regiao">Região</Label>
                <Select 
                  value={newInvestment.regiao} 
                  onValueChange={(value) => setNewInvestment({ ...newInvestment, regiao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    {regioes.map((regiao) => (
                      <SelectItem key={regiao} value={regiao}>{regiao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="google-ads">Google Ads (R$)</Label>
                <Input
                  id="google-ads"
                  type="number"
                  step="0.01"
                  value={newInvestment.investimento_google_ads}
                  onChange={(e) => setNewInvestment({ ...newInvestment, investimento_google_ads: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="meta-ads">Meta Ads (R$)</Label>
                <Input
                  id="meta-ads"
                  type="number"
                  step="0.01"
                  value={newInvestment.investimento_meta_ads}
                  onChange={(e) => setNewInvestment({ ...newInvestment, investimento_meta_ads: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="linkedin-ads">LinkedIn Ads (R$)</Label>
                <Input
                  id="linkedin-ads"
                  type="number"
                  step="0.01"
                  value={newInvestment.investimento_linkedin_ads}
                  onChange={(e) => setNewInvestment({ ...newInvestment, investimento_linkedin_ads: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="outros">Outros Investimentos (R$)</Label>
                <Input
                  id="outros"
                  type="number"
                  step="0.01"
                  value={newInvestment.outros_investimentos}
                  onChange={(e) => setNewInvestment({ ...newInvestment, outros_investimentos: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={newInvestment.observacoes}
                  onChange={(e) => setNewInvestment({ ...newInvestment, observacoes: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveInvestment} className="w-full">
                {editingInvestimento ? 'Atualizar' : 'Salvar'} Investimento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      // Não recarrega automaticamente, apenas atualiza o estado
                    }}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Canal de Aquisição</Label>
              <Select value={selectedCanalAquisicao} onValueChange={setSelectedCanalAquisicao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os canais de aquisição" />
                </SelectTrigger>
                <SelectContent>
                  {canais.map((canal) => (
                    <SelectItem key={canal.id} value={canal.id}>
                      {canal.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Vendedor</Label>
              <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os vendedores" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Região</Label>
              <Select value={selectedRegiao} onValueChange={setSelectedRegiao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as regiões" />
                </SelectTrigger>
                <SelectContent>
                  {regioes.map((regiao) => (
                    <SelectItem key={regiao} value={regiao}>
                      {regiao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-3 border-t flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setDateRange({
                  from: startOfYear(new Date()),
                  to: endOfYear(new Date())
                });
                setSelectedVendedor("");
                setSelectedRegiao("");
                setSelectedCanalAquisicao("");
                // Aplicar automaticamente após limpar
                setTimeout(() => {
                  setLoading(true);
                  Promise.all([
                    fetchMetrics(),
                    fetchChartData(),
                    fetchRegionPerformance()
                  ]).finally(() => setLoading(false));
                }, 100);
              }}
              className="flex-1"
            >
              Limpar Filtros
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setLoading(true);
                Promise.all([
                  fetchMetrics(),
                  fetchChartData(),
                  fetchRegionPerformance()
                ]).finally(() => setLoading(false));
              }}
              className="flex-1"
            >
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
            <CardTitle className="text-sm font-medium">Vendas Geradas</CardTitle>
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
              {metrics.roi.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAC</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Custo de Aquisição por Cliente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controle dos Gráficos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise de Vendas
          </CardTitle>
          <CardDescription>
            Visualize os dados por quantidade de vendas ou participação no faturamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Label htmlFor="chart-mode" className="text-sm font-medium">
              Exibir por:
            </Label>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${chartMode === 'quantidade' ? 'font-medium' : 'text-muted-foreground'}`}>
                Quantidade
              </span>
              <Switch
                id="chart-mode"
                checked={chartMode === 'faturamento'}
                onCheckedChange={(checked) => setChartMode(checked ? 'faturamento' : 'quantidade')}
              />
              <span className={`text-sm ${chartMode === 'faturamento' ? 'font-medium' : 'text-muted-foreground'}`}>
                Faturamento
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Performance por Região */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Região</CardTitle>
          <CardDescription>
            Análise detalhada do retorno de investimento por região
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Região</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                  <TableHead className="text-right">CAC</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionPerformanceData.map((data) => (
                  <TableRow key={data.regiao}>
                    <TableCell className="font-medium">{data.regiao}</TableCell>
                    <TableCell className="text-right">
                      R$ {data.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {data.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{data.vendas}</TableCell>
                    <TableCell className="text-right">
                      R$ {data.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {data.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {data.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${data.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.roi.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Público Alvo</CardTitle>
            <CardDescription>
              Distribuição por {chartMode === 'quantidade' ? 'quantidade de vendas' : 'participação no faturamento'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {publicoAlvoData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={publicoAlvoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey={chartMode === 'quantidade' ? 'vendas' : 'value'}
                    >
                      {publicoAlvoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5 % 360}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name) => [
                        chartMode === 'quantidade' 
                          ? `${value} vendas`
                          : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        chartMode === 'quantidade' ? 'Quantidade' : 'Valor Total'
                      ]}
                      labelFormatter={(label) => {
                        const item = publicoAlvoData.find(d => d.name === label);
                        return chartMode === 'quantidade' 
                          ? `${label} - R$ ${item?.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
                          : `${label} - ${item?.vendas || 0} vendas`;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma venda encontrada</p>
                  <p className="text-sm">
                    Não há dados de vendas para o período selecionado
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Canal de Aquisição</CardTitle>
            <CardDescription>
              Distribuição por {chartMode === 'quantidade' ? 'quantidade de vendas' : 'participação no faturamento'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canalAquisicaoData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={canalAquisicaoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#82ca9d"
                      dataKey={chartMode === 'quantidade' ? 'vendas' : 'value'}
                    >
                      {canalAquisicaoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5 % 360 + 180}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name) => [
                        chartMode === 'quantidade' 
                          ? `${value} vendas`
                          : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        chartMode === 'quantidade' ? 'Quantidade' : 'Valor Total'
                      ]}
                      labelFormatter={(label) => {
                        const item = canalAquisicaoData.find(d => d.name === label);
                        return chartMode === 'quantidade' 
                          ? `${label} - R$ ${item?.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
                          : `${label} - ${item?.vendas || 0} vendas`;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma venda encontrada</p>
                  <p className="text-sm">
                    Não há dados de vendas para o período selecionado
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CAC - Custo de Aquisição de Cliente</CardTitle>
            <CardDescription>
              Custo médio para adquirir um novo cliente
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

      {/* Histórico de Investimentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Investimentos</CardTitle>
          <CardDescription>
            Últimos investimentos registrados
          </CardDescription>
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