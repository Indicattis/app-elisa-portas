import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Search, DollarSign, TrendingUp, Users, Plus, Filter, Trash2, Edit, Download, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RequisicoesVenda } from "@/components/RequisicoesVenda";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BulkUploadVendas from "@/components/BulkUploadVendas";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface Venda {
  id: string;
  data_venda: string;
  atendente_nome: string;
  publico_alvo: string | null;
  canal_aquisicao_id: string | null;
  canais_aquisicao?: {
    id: string;
    nome: string;
  };
  estado: string | null;
  cidade: string | null;
  cep: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  valor_produto: number;
  custo_produto: number;
  valor_pintura: number;
  custo_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  valor_venda: number;
  lucro_total: number;
  resgate: boolean;
}

interface VendaStats {
  // Dados por estado
  rs: {
    lucroProdutos: number;
    lucroPintura: number;
    totalInstalacoes: number;
    totalFretes: number;
    lucroTotal: number;
    faturamentoTotal: number;
  };
  sc: {
    lucroProdutos: number;
    lucroPintura: number;
    totalInstalacoes: number;
    totalFretes: number;
    lucroTotal: number;
    faturamentoTotal: number;
  };
  total: {
    lucroProdutos: number;
    lucroPintura: number;
    totalInstalacoes: number;
    totalFretes: number;
    lucroTotal: number;
    faturamentoTotal: number;
  };
}

export default function Faturamento() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [stats, setStats] = useState<VendaStats>({
    rs: {
      lucroProdutos: 0,
      lucroPintura: 0,
      totalInstalacoes: 0,
      totalFretes: 0,
      lucroTotal: 0,
      faturamentoTotal: 0,
    },
    sc: {
      lucroProdutos: 0,
      lucroPintura: 0,
      totalInstalacoes: 0,
      totalFretes: 0,
      lucroTotal: 0,
      faturamentoTotal: 0,
    },
    total: {
      lucroProdutos: 0,
      lucroPintura: 0,
      totalInstalacoes: 0,
      totalFretes: 0,
      lucroTotal: 0,
      faturamentoTotal: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublico, setFilterPublico] = useState("todos");
  const [filterResgate, setFilterResgate] = useState("todos");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { isAdmin, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin || userRole?.role === 'gerente_comercial') {
      fetchVendas();
      fetchStats();
    }
  }, [isAdmin, userRole, dateRange]);

  const fetchVendas = async () => {
    try {
      let query = supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          atendente_id,
          publico_alvo,
          canal_aquisicao_id,
          estado,
          cidade,
          cep,
          cliente_nome,
          cliente_telefone,
          cliente_email,
          valor_produto,
          custo_produto,
          valor_pintura,
          custo_pintura,
          valor_instalacao,
          valor_frete,
          valor_venda,
          lucro_total,
          resgate,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
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

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set(vendasData.map(venda => venda.atendente_id))];
      const { data: atendentesData } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .in("user_id", atendenteIds);

      const atendenteMap = new Map(atendentesData?.map(atendente => [atendente.user_id, atendente.nome]) || []);

      const vendasCompletas = vendasData.map((venda) => ({
        ...venda,
        atendente_nome: atendenteMap.get(venda.atendente_id) || "Atendente não encontrado",
      }));

      setVendas(vendasCompletas);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!dateRange?.from || !dateRange?.to) return;

      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = format(dateRange.to, "yyyy-MM-dd");

      const { data: vendasPeriodo, error } = await supabase
        .from("vendas")
        .select("valor_produto, custo_produto, valor_pintura, custo_pintura, valor_instalacao, valor_frete, lucro_total, estado")
        .gte("data_venda", startDate + " 00:00:00")
        .lte("data_venda", endDate + " 23:59:59");

      if (error) throw error;

      const vendasRS = vendasPeriodo?.filter(v => v.estado === 'RS') || [];
      const vendasSC = vendasPeriodo?.filter(v => v.estado === 'SC') || [];
      const todasVendas = vendasPeriodo || [];

      const calcularStats = (vendas: any[]) => ({
        lucroProdutos: vendas.reduce((acc, v) => acc + ((v.valor_produto || 0) - (v.custo_produto || 0)), 0),
        lucroPintura: vendas.reduce((acc, v) => acc + ((v.valor_pintura || 0) - (v.custo_pintura || 0)), 0),
        totalInstalacoes: vendas.reduce((acc, v) => acc + (v.valor_instalacao || 0), 0),
        totalFretes: vendas.reduce((acc, v) => acc + (v.valor_frete || 0), 0),
        lucroTotal: vendas.reduce((acc, v) => acc + (v.lucro_total || 0), 0),
        faturamentoTotal: vendas.reduce((acc, v) => 
          acc + (v.valor_produto || 0) + (v.valor_pintura || 0) + 
          (v.valor_instalacao || 0) + (v.valor_frete || 0), 0),
      });

      setStats({
        rs: calcularStats(vendasRS),
        sc: calcularStats(vendasSC),
        total: calcularStats(todasVendas),
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const handleDeleteVenda = async (vendaId: string) => {
    try {
      const { error } = await supabase
        .from("vendas")
        .delete()
        .eq("id", vendaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Venda excluída com sucesso",
      });

      fetchVendas();
      fetchStats();
    } catch (error) {
      console.error("Erro ao excluir venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir venda",
      });
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const periodo = dateRange?.from && dateRange?.to 
      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
      : 'Período não definido';
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text(`Relatório de Faturamento - ${periodo}`, 20, 20);
    
    // Resumo por estado
    doc.setFontSize(14);
    doc.text('Resumo por Estado', 20, 40);
    
    const resumoData = [
      ['Métrica', 'RS', 'SC', 'Total'],
      [
        'Lucro Produtos',
        `R$ ${stats.rs.lucroProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.sc.lucroProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.total.lucroProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        'Lucro Pintura',
        `R$ ${stats.rs.lucroPintura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.sc.lucroPintura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.total.lucroPintura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        'Total Instalações',
        `R$ ${stats.rs.totalInstalacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.sc.totalInstalacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.total.totalInstalacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        'Total Fretes',
        `R$ ${stats.rs.totalFretes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.sc.totalFretes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.total.totalFretes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        'Lucro Total',
        `R$ ${stats.rs.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.sc.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.total.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ],
      [
        'Faturamento Total',
        `R$ ${stats.rs.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.sc.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${stats.total.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]
    ];

    autoTable(doc, {
      head: [resumoData[0]],
      body: resumoData.slice(1),
      startY: 50,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Salvar arquivo
    const fileName = dateRange?.from && dateRange?.to 
      ? `relatorio-faturamento-${format(dateRange.from, "yyyy-MM-dd")}-${format(dateRange.to, "yyyy-MM-dd")}.pdf`
      : `relatorio-faturamento-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = 
      (venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPublico = filterPublico === "todos" || venda.publico_alvo === filterPublico;
    const matchesResgate = filterResgate === "todos" || 
      (filterResgate === "sim" ? venda.resgate : !venda.resgate);

    return matchesSearch && matchesPublico && matchesResgate;
  });

  const meses = [
    { value: 1, label: "Janeiro" }, { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" }, { value: 4, label: "Abril" },
    { value: 5, label: "Maio" }, { value: 6, label: "Junho" },
    { value: 7, label: "Julho" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" }, { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" }, { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!isAdmin && userRole?.role !== 'gerente_comercial') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta página requer permissões de administrador ou gerente comercial.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">
            Gestão de vendas e controle financeiro
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportarPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={() => navigate("/dashboard/vendas/nova")} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/vendas/vincular")} size="sm">
            Vincular Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vendas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="requisicoes">Requisições</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          {/* Stats Cards por Estado */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* RS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rio Grande do Sul (RS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Lucro Produtos:</span>
                  <span className="font-medium text-green-600">
                    R$ {stats.rs.lucroProdutos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lucro Pintura:</span>
                  <span className="font-medium text-green-600">
                    R$ {stats.rs.lucroPintura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Instalações:</span>
                  <span className="font-medium">
                    R$ {stats.rs.totalInstalacoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Fretes:</span>
                  <span className="font-medium">
                    R$ {stats.rs.totalFretes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Lucro Total:</span>
                  <span className="font-bold text-green-600">
                    R$ {stats.rs.lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Faturamento:</span>
                  <span className="font-bold text-blue-600">
                    R$ {stats.rs.faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* SC */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Santa Catarina (SC)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Lucro Produtos:</span>
                  <span className="font-medium text-green-600">
                    R$ {stats.sc.lucroProdutos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lucro Pintura:</span>
                  <span className="font-medium text-green-600">
                    R$ {stats.sc.lucroPintura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Instalações:</span>
                  <span className="font-medium">
                    R$ {stats.sc.totalInstalacoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Fretes:</span>
                  <span className="font-medium">
                    R$ {stats.sc.totalFretes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Lucro Total:</span>
                  <span className="font-bold text-green-600">
                    R$ {stats.sc.lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Faturamento:</span>
                  <span className="font-bold text-blue-600">
                    R$ {stats.sc.faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* TOTAL */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">TOTAL GERAL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Lucro Produtos:</span>
                  <span className="font-medium text-green-600">
                    R$ {stats.total.lucroProdutos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lucro Pintura:</span>
                  <span className="font-medium text-green-600">
                    R$ {stats.total.lucroPintura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Instalações:</span>
                  <span className="font-medium">
                    R$ {stats.total.totalInstalacoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Fretes:</span>
                  <span className="font-medium">
                    R$ {stats.total.totalFretes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Lucro Total:</span>
                  <span className="font-bold text-green-600 text-lg">
                    R$ {stats.total.lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Faturamento:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    R$ {stats.total.faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>
                    {filteredVendas.length} vendas encontradas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Período:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-64 justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                              {format(dateRange.to, "dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
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
                        }}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setLoading(true);
                      fetchVendas();
                      fetchStats();
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente, atendente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <Select value={filterPublico} onValueChange={setFilterPublico}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="serralheiro">Serralheiro</SelectItem>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterResgate} onValueChange={setFilterResgate}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Resgate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Resgate</SelectItem>
                    <SelectItem value="nao">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Atendente</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Público</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Produto</TableHead>
                      <TableHead className="text-right">Pintura</TableHead>
                      <TableHead className="text-right">Instalação</TableHead>
                      <TableHead className="text-right">Frete</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendas.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell>
                          {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {venda.atendente_nome}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{venda.cliente_nome}</p>
                            <p className="text-sm text-muted-foreground">{venda.cliente_telefone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {venda.publico_alvo && (
                            <Badge variant={venda.publico_alvo === 'serralheiro' ? 'default' : 'secondary'}>
                              {venda.publico_alvo === 'serralheiro' ? 'Serralheiro' : 'Cliente Final'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{venda.canais_aquisicao?.nome || 'Canal não especificado'}</Badge>
                        </TableCell>
                        <TableCell>
                          {venda.cidade && venda.estado ? `${venda.cidade}, ${venda.estado}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_produto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_pintura || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_instalacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_frete || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {((venda.valor_produto || 0) + (venda.valor_pintura || 0) + 
                            (venda.valor_instalacao || 0) + (venda.valor_frete || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={venda.lucro_total > 0 ? "text-green-600 font-medium" : "text-red-600"}>
                            R$ {(venda.lucro_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {venda.resgate && (
                            <Badge variant="destructive">Resgate</Badge>
                          )}
                        </TableCell>
                         <TableCell>
                            <div className="flex items-center gap-2">
                              {(isAdmin || userRole?.role === 'gerente_comercial') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => navigate(`/dashboard/vendas/${venda.id}/editar`)}
                                  title="Editar venda"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" title="Excluir venda">
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteVenda(venda.id)}>
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <BulkUploadVendas onUploadComplete={() => {
            fetchVendas();
            fetchStats();
          }} />
        </TabsContent>

        <TabsContent value="requisicoes">
          <RequisicoesVenda />
        </TabsContent>
      </Tabs>
    </div>
  );
}