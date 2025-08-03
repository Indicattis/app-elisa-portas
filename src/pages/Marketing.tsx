import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Users, Target, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface MarketingInvestment {
  id: string;
  mes: string;
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
  canal_aquisicao: string;
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

export default function Marketing() {
  const { isAdmin, isGerenteComercial } = useAuth();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedVendedor, setSelectedVendedor] = useState<string>("todos");
  const [selectedRegiao, setSelectedRegiao] = useState<string>("todas");
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
  const [publicoAlvoData, setPublicoAlvoData] = useState<PublicoAlvoData[]>([]);
  const [canalAquisicaoData, setCanalAquisicaoData] = useState<CanalAquisicaoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    mes: selectedMonth,
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
  }, [selectedMonth, selectedVendedor, selectedRegiao]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvestimentos(),
        fetchVendedores(),
        fetchMetrics(),
        fetchChartData()
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
    const { data, error } = await supabase
      .from("marketing_investimentos")
      .select("*")
      .order("mes", { ascending: false });

    if (error) {
      console.error("Erro ao buscar investimentos:", error);
      setInvestimentos([]);
      return;
    }
    setInvestimentos(data || []);
  };

  const fetchVendedores = async () => {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id, nome")
      .eq("ativo", true);

    if (error) throw error;
    setVendedores(data?.map(v => ({ id: v.user_id, nome: v.nome })) || []);
  };

  const fetchMetrics = async () => {
    // Construir datas do mês selecionado em UTC para evitar problemas de timezone
    const [year, month] = selectedMonth.split('-');
    const mesStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const mesEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    // Buscar investimentos do mês
    const { data: investimentoData } = await supabase
      .from("marketing_investimentos")
      .select("*")
      .eq("mes", selectedMonth + "-01")
      .maybeSingle();

    const totalInvestimento = investimentoData ? (
      Number(investimentoData.investimento_google_ads) +
      Number(investimentoData.investimento_meta_ads) +
      Number(investimentoData.investimento_linkedin_ads) +
      Number(investimentoData.outros_investimentos)
    ) : 0;

    // Buscar vendas do mês com filtros
    let vendasQuery = supabase
      .from("vendas")
      .select(`
        valor_venda, atendente_id, estado, canal_aquisicao, canal_aquisicao_id, data_venda,
        canais_aquisicao:canal_aquisicao_id (
          id,
          nome
        )
      `)
      .gte("data_venda", mesStart.toISOString())
      .lte("data_venda", mesEnd.toISOString());

    if (selectedVendedor !== "todos") {
      vendasQuery = vendasQuery.eq("atendente_id", selectedVendedor);
    }

    if (selectedRegiao !== "todas") {
      vendasQuery = vendasQuery.eq("estado", selectedRegiao);
    }

    const { data: vendasData } = await vendasQuery;

    // Buscar leads do mês com filtros
    let leadsQuery = supabase
      .from("elisaportas_leads")
      .select("id, atendente_id, endereco_estado, novo_status")
      .gte("data_envio", mesStart.toISOString())
      .lte("data_envio", mesEnd.toISOString());

    if (selectedVendedor !== "todos") {
      leadsQuery = leadsQuery.eq("atendente_id", selectedVendedor);
    }

    if (selectedRegiao !== "todas") {
      leadsQuery = leadsQuery.eq("endereco_estado", selectedRegiao);
    }

    const { data: leadsData } = await leadsQuery;

    const totalVendas = vendasData?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0;
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

  const handleSaveInvestment = async () => {
    try {
      const { error } = await supabase
        .from("marketing_investimentos")
        .upsert({
          mes: newInvestment.mes + "-01",
          investimento_google_ads: newInvestment.investimento_google_ads,
          investimento_meta_ads: newInvestment.investimento_meta_ads,
          investimento_linkedin_ads: newInvestment.investimento_linkedin_ads,
          outros_investimentos: newInvestment.outros_investimentos,
          observacoes: newInvestment.observacoes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: "mes"
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Investimento salvo com sucesso",
      });

      setDialogOpen(false);
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

  const fetchChartData = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const mesStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const mesEnd = endOfMonth(new Date(parseInt(year), parseInt(month) - 1));

      // Buscar vendas do mês com canais de aquisição
      let vendasQuery = supabase
        .from("vendas")
        .select(`
          valor_venda, publico_alvo, canal_aquisicao, canal_aquisicao_id,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
          )
        `)
        .gte("data_venda", mesStart.toISOString())
        .lte("data_venda", mesEnd.toISOString());

      if (selectedVendedor !== "todos") {
        vendasQuery = vendasQuery.eq("atendente_id", selectedVendedor);
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
          const canal = venda.canais_aquisicao?.nome || venda.canal_aquisicao || 'Não informado';
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

  const regioes = ["RS", "SC"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">
            Análise de performance e investimentos em marketing
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Investimento</DialogTitle>
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
                Salvar Investimento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month">Mês</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vendedor">Vendedor</Label>
              <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="regiao">Região</Label>
              <Select value={selectedRegiao} onValueChange={setSelectedRegiao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {regioes.map((regiao) => (
                    <SelectItem key={regiao} value={regiao}>
                      {regiao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.taxaConversao.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.vendasConvertidas} de {metrics.totalLeads} leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Público Alvo</CardTitle>
            <CardDescription>
              Distribuição de vendas por segmento de público
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
                      dataKey="value"
                    >
                      {publicoAlvoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5 % 360}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name) => [
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        'Valor Total'
                      ]}
                      labelFormatter={(label) => {
                        const item = publicoAlvoData.find(d => d.name === label);
                        return `${label} - ${item?.vendas || 0} vendas`;
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
              Distribuição de vendas por canal de marketing
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
                      dataKey="value"
                    >
                      {canalAquisicaoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 137.5 % 360 + 180}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name) => [
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        'Valor Total'
                      ]}
                      labelFormatter={(label) => {
                        const item = canalAquisicaoData.find(d => d.name === label);
                        return `${label} - ${item?.vendas || 0} vendas`;
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
              Dados do mês de {format(new Date(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}
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
            {investimentos.slice(0, 5).map((investimento) => (
              <div key={investimento.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">
                    {format(new Date(investimento.mes), "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {investimento.observacoes && (
                    <p className="text-sm text-muted-foreground">{investimento.observacoes}</p>
                  )}
                </div>
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}