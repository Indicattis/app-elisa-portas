import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Search, DollarSign, TrendingUp, CalendarIcon, ArrowLeft, Download, CheckCircle2, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { generateFaturamentoPDF } from "@/utils/faturamentoPDFGenerator";
import { ProductIconsSummary } from "@/components/vendas/ProductIconsSummary";

interface Venda {
  id: string;
  data_venda: string;
  atendente_id: string;
  atendente_nome: string;
  atendente_foto?: string | null;
  publico_alvo: string | null;
  estado: string | null;
  cidade: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  valor_produto: number;
  custo_produto: number;
  valor_pintura: number;
  custo_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  valor_venda: number;
  valor_credito?: number;
  lucro_total: number;
  frete_aprovado?: boolean;
  portas?: any[];
  produtos?: any[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function FaturamentoMinimalista() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'todas' | 'faturadas' | 'nao_faturadas'>('todas');
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [atendentes, setAtendentes] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchVendas();
    fetchAtendentes();
  }, [dateRange]);

  const fetchAtendentes = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id, nome')
      .order('nome');
    if (data) setAtendentes(data);
  };

  const fetchVendas = async () => {
    try {
      let query = supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          atendente_id,
          publico_alvo,
          estado,
          cidade,
          cliente_nome,
          valor_instalacao,
          valor_frete,
          valor_venda,
          valor_credito,
          lucro_total,
          custo_total,
          frete_aprovado,
          produtos_vendas (
            id,
            tipo_produto,
            valor_produto,
            valor_pintura,
            quantidade,
            lucro_item,
            custo_produto,
            custo_pintura,
            faturamento
          )
        `)
        .order("data_venda", { ascending: false });

      if (dateRange?.from && dateRange?.to) {
        const startDate = format(dateRange.from, "yyyy-MM-dd");
        const endDate = format(dateRange.to, "yyyy-MM-dd");
        query = query
          .gte("data_venda", startDate + " 00:00:00")
          .lte("data_venda", endDate + " 23:59:59");
      }

      const { data: vendasData, error } = await query;
      if (error) throw error;

      if (!vendasData || vendasData.length === 0) {
        setVendas([]);
        return;
      }

      const { data: todosUsuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url");

      const atendenteMap = new Map();
      if (todosUsuarios) {
        todosUsuarios.forEach(user => {
          atendenteMap.set(user.user_id, { nome: user.nome, foto: user.foto_perfil_url });
        });
      }

      const vendasCompletas = vendasData.map((venda: any) => {
        const atendenteData = venda.atendente_id ? atendenteMap.get(venda.atendente_id) : null;
        const portas = venda.produtos_vendas || [];
        
        const valor_produto = portas.reduce((acc: number, p: any) => 
          acc + (p.valor_produto || 0) * (p.quantidade || 1), 0);
        const valor_pintura = portas.reduce((acc: number, p: any) => 
          acc + (p.valor_pintura || 0) * (p.quantidade || 1), 0);
        
        const portasFaturadas = portas.filter((p: any) => (p.lucro_item || 0) > 0);
        const custo_produto = portasFaturadas.reduce((acc: number, p: any) => 
          acc + ((p.custo_produto || 0) * (p.quantidade || 1)), 0);
        const custo_pintura = portasFaturadas.reduce((acc: number, p: any) => 
          acc + ((p.custo_pintura || 0) * (p.quantidade || 1)), 0);
        
        return {
          ...venda,
          atendente_nome: atendenteData?.nome || "Atendente não encontrado",
          atendente_foto: atendenteData?.foto || null,
          portas,
          valor_produto,
          valor_pintura,
          custo_produto,
          custo_pintura,
        };
      });

      setVendas(vendasCompletas);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFaturada = (venda: Venda) => {
    const portas = venda.portas || [];
    if (portas.length === 0) return false;
    const freteAprovado = (venda as any).frete_aprovado === true;
    const temCustoTotal = ((venda as any).custo_total || 0) > 0;
    if (!freteAprovado || !temCustoTotal) return false;
    return portas.every((p: any) => p.faturamento === true);
  };

  const filteredVendas = vendas.filter(venda => {
    if (activeTab === 'faturadas' && !isFaturada(venda)) return false;
    if (activeTab === 'nao_faturadas' && isFaturada(venda)) return false;
    if (selectedAtendente !== "todos" && venda.atendente_id !== selectedAtendente) return false;
    
    const matchesSearch = 
      (venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const vendasFaturadas = filteredVendas.filter(isFaturada);
  
  const faturamentoTotal = filteredVendas.reduce((acc, v) => 
    acc + ((v.valor_venda || 0) + (v.valor_credito || 0) - (v.valor_frete || 0)), 0);
  
  const lucroBrutoTotal = vendasFaturadas.reduce((acc, v) => {
    const portas = v.portas || [];
    const lucroItens = portas.reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
    return acc + lucroItens + (v.valor_instalacao || 0);
  }, 0);

  const handleGeneratePDF = () => {
    if (filteredVendas.length > 1000) {
      toast({
        variant: "destructive",
        title: "Muitos registros",
        description: "O PDF suporta no máximo 1000 registros.",
      });
      return;
    }

    const stats = {
      faturamentoTotal,
      custosProducao: vendasFaturadas.reduce((acc, v) => acc + (v.custo_produto || 0), 0),
      custosPintura: vendasFaturadas.reduce((acc, v) => acc + (v.custo_pintura || 0), 0),
      instalacoesTotais: filteredVendas.reduce((acc, v) => acc + (v.valor_instalacao || 0), 0),
      fretesTotais: filteredVendas.reduce((acc, v) => acc + (v.valor_frete || 0), 0),
      quantidadePortas: filteredVendas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas.reduce((sum: number, p: any) => sum + (p.quantidade || 0), 0);
      }, 0),
      lucroPintura: vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas
          .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
          .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
      }, 0),
      lucroPortas: vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas
          .filter((p: any) => ['porta', 'porta_enrolar'].includes(p.tipo_produto))
          .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
      }, 0),
      lucroBrutoTotal,
    };

    const periodo = dateRange?.from && dateRange?.to 
      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
      : undefined;

    generateFaturamentoPDF({
      vendas: filteredVendas,
      stats,
      filtros: { tab: activeTab, periodo }
    });
    
    toast({
      title: "PDF gerado com sucesso!",
      description: "O arquivo foi baixado automaticamente.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-white/10" />
          <Skeleton className="h-24 bg-white/10" />
          <Skeleton className="h-24 bg-white/10" />
        </div>
        <Skeleton className="h-96 bg-white/10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Financeiro", path: "/administrativo/financeiro" },
          { label: "Faturamento" }
        ]} 
        mounted={mounted} 
      />

      {/* Menu de Perfil Flutuante */}
      <FloatingProfileMenu mounted={mounted} />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/administrativo/financeiro')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      <div className="container mx-auto p-6 pt-20 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faturamento</h1>
            <p className="text-white/60">Controle de vendas e faturamento</p>
          </div>
          <Button 
            onClick={handleGeneratePDF}
            className="bg-white/10 hover:bg-white/20 border border-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(faturamentoTotal)}</div>
              <p className="text-xs text-white/50">{filteredVendas.length} vendas no período</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Lucro Bruto</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(lucroBrutoTotal)}</div>
              <p className="text-xs text-white/50">{vendasFaturadas.length} vendas faturadas</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Taxa de Conversão</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {filteredVendas.length > 0 
                  ? `${((vendasFaturadas.length / filteredVendas.length) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <p className="text-xs text-white/50">vendas faturadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Buscar por cliente, atendente ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              
              <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                <SelectTrigger className="w-[200px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Atendente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos atendentes</SelectItem>
                  {atendentes.map((at) => (
                    <SelectItem key={at.user_id} value={at.user_id}>{at.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                      !dateRange && "text-white/50"
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
              <TabsList className="bg-white/5">
                <TabsTrigger value="todas" className="data-[state=active]:bg-white/20">
                  Todas ({filteredVendas.length})
                </TabsTrigger>
                <TabsTrigger value="faturadas" className="data-[state=active]:bg-white/20">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Faturadas ({vendasFaturadas.length})
                </TabsTrigger>
                <TabsTrigger value="nao_faturadas" className="data-[state=active]:bg-white/20">
                  <Clock className="h-4 w-4 mr-1" />
                  Pendentes ({filteredVendas.length - vendasFaturadas.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Table */}
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70">Data</TableHead>
                    <TableHead className="text-white/70">Cliente</TableHead>
                    <TableHead className="text-white/70">Atendente</TableHead>
                    <TableHead className="text-white/70">Produtos</TableHead>
                    <TableHead className="text-white/70 text-right">Valor Total</TableHead>
                    <TableHead className="text-white/70 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-white/50 py-8">
                        Nenhuma venda encontrada no período
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendas.map((venda) => (
                      <TableRow 
                        key={venda.id} 
                        className="border-white/10 hover:bg-white/5 cursor-pointer"
                        onClick={() => navigate(`/dashboard/administrativo/financeiro/faturamento/${venda.id}/edit`)}
                      >
                        <TableCell className="text-white/80">
                          {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {venda.cliente_nome || "Não informado"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={venda.atendente_foto || undefined} />
                              <AvatarFallback className="text-xs bg-white/20 text-white">
                                {venda.atendente_nome.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-white/80 text-sm">{venda.atendente_nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ProductIconsSummary venda={{ produtos: venda.portas || [] }} />
                        </TableCell>
                        <TableCell className="text-right text-white font-medium">
                          {formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          {isFaturada(venda) ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Faturada
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
