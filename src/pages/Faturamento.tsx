import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, DollarSign, TrendingUp, Users, Plus, Filter, Trash2, Edit, Download, CalendarIcon, Receipt, DoorOpen, Wrench, Hammer, Palette, Percent, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BulkUploadVendas from "@/components/BulkUploadVendas";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/vendas/StatusBadge";

import { ProductIconsSummary } from "@/components/vendas/ProductIconsSummary";
import { VendaDetailsModal } from "@/components/vendas/VendaDetailsModal";
import { generateFaturamentoPDF } from "@/utils/faturamentoPDFGenerator";

interface Venda {
  id: string;
  data_venda: string;
  atendente_id: string;
  atendente_nome: string;
  atendente_foto?: string | null;
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
  frete_aprovado?: boolean;
  portas?: any[];
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'todas' | 'faturadas' | 'nao_faturadas'>('todas');
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [atendentes, setAtendentes] = useState<any[]>([]);
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Função para verificar se uma venda está faturada (baseado no lucro_item e frete aprovado)
  const isFaturada = (venda: Venda) => {
    const portas = venda.portas || [];
    if (portas.length === 0) return false;
    
    // Verifica se todos os produtos têm lucro definido
    const todosProdutosFaturados = portas.every((p: any) => (p.lucro_item || 0) > 0);
    
    // Verifica se o frete foi aprovado
    const freteAprovado = (venda as any).frete_aprovado === true;
    
    // Venda está faturada se todos os produtos têm lucro E o frete foi aprovado
    return todosProdutosFaturados && freteAprovado;
  };

  // Função para verificar se uma venda está parcialmente faturada
  const isParcialmenteFaturada = (venda: Venda) => {
    const portas = venda.portas || [];
    if (portas.length === 0) return false;
    
    const algunsProdutosFaturados = portas.some((p: any) => (p.lucro_item || 0) > 0);
    const todosProdutosFaturados = portas.every((p: any) => (p.lucro_item || 0) > 0);
    const freteAprovado = (venda as any).frete_aprovado === true;
    
    // Parcialmente faturada se:
    // - Alguns (mas não todos) produtos têm lucro, OU
    // - Todos os produtos têm lucro MAS o frete não foi aprovado
    return algunsProdutosFaturados && (!todosProdutosFaturados || !freteAprovado);
  };

  // Função para calcular total de descontos
  const calculateTotalDiscount = (venda: Venda) => {
    const portas = venda.portas || [];
    
    let totalDescontoValor = 0;
    
    portas.forEach((produto: any) => {
      if (produto.tipo_desconto === 'valor') {
        totalDescontoValor += produto.desconto_valor || 0;
      } else if (produto.tipo_desconto === 'percentual') {
        const valorProduto = produto.valor_produto || 0;
        const desconto = (valorProduto * (produto.desconto_percentual || 0)) / 100;
        totalDescontoValor += desconto;
      }
    });
    
    return totalDescontoValor;
  };

  // Handler de double click
  const handleRowDoubleClick = (venda: Venda) => {
    setSelectedVenda(venda);
    setIsDetailsModalOpen(true);
  };

  useEffect(() => {
    fetchVendas();
    fetchStats();
    fetchAtendentes();
  }, [dateRange]);

  const fetchAtendentes = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id, nome')
      .eq('ativo', true)
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
          canal_aquisicao_id,
          estado,
          cidade,
          cep,
          cliente_nome,
          cliente_telefone,
          cliente_email,
          valor_instalacao,
          valor_frete,
          valor_venda,
          lucro_total,
          custo_total,
          frete_aprovado,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
          ),
          portas_vendas (
            id,
            tipo_produto,
            descricao,
            valor_produto,
            valor_pintura,
            valor_instalacao,
            valor_total,
            quantidade,
            desconto_percentual,
            desconto_valor,
            tipo_desconto,
            tamanho,
            lucro_item,
            lucro_produto,
            lucro_pintura,
            custo_produto,
            custo_pintura,
            margem_produto,
            margem_pintura
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

      // Buscar todos os usuários ativos para mapear atendentes
      const { data: todosUsuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url")
        .eq("ativo", true);

      const atendenteMap = new Map();
      if (todosUsuarios) {
        todosUsuarios.forEach(user => {
          atendenteMap.set(user.user_id, { nome: user.nome, foto: user.foto_perfil_url });
        });
      }

      const vendasCompletas = vendasData.map((venda: any) => {
        const atendenteData = venda.atendente_id ? atendenteMap.get(venda.atendente_id) : null;
        const portas = venda.portas_vendas || [];
        
        // Calcular valores agregados dos produtos
        const valor_produto = portas.reduce((acc: number, p: any) => 
          acc + (p.valor_produto || 0) * (p.quantidade || 1), 0);
        const valor_pintura = portas.reduce((acc: number, p: any) => 
          acc + (p.valor_pintura || 0) * (p.quantidade || 1), 0);
        
        // Corrigir cálculo de custos: devem vir dos produtos apenas se foram faturados (lucro_item > 0)
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

  const fetchStats = async () => {
    try {
      if (!dateRange?.from || !dateRange?.to) return;

      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = format(dateRange.to, "yyyy-MM-dd");

      const { data: vendasPeriodo, error } = await supabase
        .from("vendas")
        .select("valor_venda, custo_total, valor_instalacao, valor_frete, lucro_total, estado")
        .gte("data_venda", startDate + " 00:00:00")
        .lte("data_venda", endDate + " 23:59:59");

      if (error) throw error;

      const vendasRS = vendasPeriodo?.filter(v => v.estado === 'RS') || [];
      const vendasSC = vendasPeriodo?.filter(v => v.estado === 'SC') || [];
      const todasVendas = vendasPeriodo || [];

      const calcularStats = (vendas: any[]) => ({
        lucroProdutos: 0,
        lucroPintura: 0,
        totalInstalacoes: vendas.reduce((acc, v) => acc + (v.valor_instalacao || 0), 0),
        totalFretes: vendas.reduce((acc, v) => acc + (v.valor_frete || 0), 0),
        lucroTotal: vendas.reduce((acc, v) => acc + (v.lucro_total || 0), 0),
        faturamentoTotal: vendas.reduce((acc, v) => acc + (v.valor_venda || 0), 0),
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

  const handleGeneratePDF = () => {
    // Validação: limite de 1000 registros
    if (filteredVendas.length > 1000) {
      toast({
        variant: "destructive",
        title: "Muitos registros",
        description: "O PDF suporta no máximo 1000 registros. Por favor, aplique filtros para reduzir o número de vendas.",
      });
      return;
    }

    // Calcular estatísticas com base nas vendas filtradas
    const vendasFaturadas = filteredVendas.filter(isFaturada);
    
    const stats = {
      faturamentoTotal: filteredVendas.reduce((acc, v) => 
        acc + ((v.valor_venda || 0) - (v.valor_frete || 0)), 0),
      custosProducao: vendasFaturadas.reduce((acc, v) => 
        acc + (v.custo_produto || 0), 0),
      custosPintura: vendasFaturadas.reduce((acc, v) => 
        acc + (v.custo_pintura || 0), 0),
      lucroBrutoTotal: 0, // Será calculado dentro do gerador
      instalacoesTotais: filteredVendas.reduce((acc, v) => 
        acc + (v.valor_instalacao || 0), 0),
      fretesTotais: filteredVendas.reduce((acc, v) => 
        acc + (v.valor_frete || 0), 0),
    };

    // Preparar dados do período
    const periodo = dateRange?.from && dateRange?.to 
      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
      : undefined;

    // Chamar gerador
    generateFaturamentoPDF({
      vendas: filteredVendas,
      stats,
      filtros: {
        tab: activeTab,
        periodo,
      }
    });
    
    toast({
      title: "PDF gerado com sucesso!",
      description: "O arquivo foi baixado automaticamente.",
    });
  };

  const filteredVendas = vendas.filter(venda => {
    // Filtro de aba
    if (activeTab === 'faturadas' && !isFaturada(venda)) return false;
    if (activeTab === 'nao_faturadas' && isFaturada(venda)) return false;

    // Filtro por atendente
    if (selectedAtendente !== "todos" && venda.atendente_id !== selectedAtendente) {
      return false;
    }

    // Filtros de busca e público
    const matchesSearch = 
      (venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPublico = filterPublico === "todos" || venda.publico_alvo === filterPublico;

    return matchesSearch && matchesPublico;
  });

  // Separar vendas faturadas para cálculo de indicadores
  const vendasFaturadas = filteredVendas.filter(isFaturada);

  // Calcular novos indicadores
  const indicadores = {
    quantidadePortas: vendasFaturadas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas.filter((p: any) => 
        ['porta', 'porta_enrolar'].includes(p.tipo_produto)
      ).reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
    }, 0),
    
    lucroPintura: vendasFaturadas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas.reduce((sum: number, p: any) => 
        sum + ((p.lucro_pintura || 0) * (p.quantidade || 1)), 0);
    }, 0),
    
    lucroPortas: vendasFaturadas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas.reduce((sum: number, p: any) => 
        sum + ((p.lucro_produto || 0) * (p.quantidade || 1)), 0);
    }, 0),
    
    lucroInstalacoes: filteredVendas.reduce((acc, v) => 
      acc + (v.valor_instalacao || 0), 0),
    
    lucroBrutoTotal: vendasFaturadas.reduce((acc, v) => {
      const portas = v.portas || [];
      const lucroPortasEPintura = portas.reduce((sum: number, p: any) => {
        const lucroProd = (p.lucro_produto || 0) * (p.quantidade || 1);
        const lucroPint = (p.lucro_pintura || 0) * (p.quantidade || 1);
        return sum + lucroProd + lucroPint;
      }, 0);
      const lucroInstalacao = v.valor_instalacao || 0;
      return acc + lucroPortasEPintura + lucroInstalacao;
    }, 0),
    
    faturamentoTotal: filteredVendas.reduce((acc, v) => 
      acc + ((v.valor_venda || 0) - (v.valor_frete || 0)), 0),
    
    fretesTotais: filteredVendas.reduce((acc, v) => 
      acc + (v.valor_frete || 0), 0),
  };


  const meses = [
    { value: 1, label: "Janeiro" }, { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" }, { value: 4, label: "Abril" },
    { value: 5, label: "Maio" }, { value: 6, label: "Junho" },
    { value: 7, label: "Julho" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" }, { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" }, { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

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
          <Button onClick={handleGeneratePDF} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          {/* Abas de Faturamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status de Faturamento</CardTitle>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>{vendasFaturadas.length} faturadas</span>
                  <span>•</span>
                  <span>{filteredVendas.length - vendasFaturadas.length} não faturadas</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="todas">
                    Todas ({filteredVendas.length})
                  </TabsTrigger>
                  <TabsTrigger value="faturadas">
                    Faturadas ({vendasFaturadas.length})
                  </TabsTrigger>
                  <TabsTrigger value="nao_faturadas">
                    Não Faturadas ({filteredVendas.length - vendasFaturadas.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
          {/* Indicador Principal - Faturamento Total (Destacado) */}
          <div className="flex justify-center">
            <Card className="w-full max-w-2xl border-2 border-blue-600 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex items-center justify-center gap-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                  Faturamento Total (sem frete)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600 text-center">
                  R$ {indicadores.faturamentoTotal.toLocaleString("pt-BR", { 
                    minimumFractionDigits: 2 
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {filteredVendas.length} vendas no período
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Indicadores em Colunas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Indicadores do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center py-3 px-2 font-semibold text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span>Faturamento Total</span>
                          <span className="text-xs font-normal text-muted-foreground">(sem frete)</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <DoorOpen className="h-4 w-4 text-slate-600" />
                          <span>Qtd Portas</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <DoorOpen className="h-4 w-4 text-amber-600" />
                          <span>Lucro Portas</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <Palette className="h-4 w-4 text-purple-600" />
                          <span>Lucro Pintura</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <Wrench className="h-4 w-4 text-cyan-600" />
                          <span>Instalações</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-indigo-600" />
                          <span>Fretes</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Lucro Bruto</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center py-4 px-2 font-bold text-blue-600">
                        R$ {indicadores.faturamentoTotal.toLocaleString("pt-BR", { 
                          minimumFractionDigits: 2 
                        })}
                      </td>
                      <td className="text-center py-4 px-2 font-semibold">
                        {indicadores.quantidadePortas}
                      </td>
                      <td className="text-center py-4 px-2 font-semibold text-amber-600">
                        R$ {indicadores.lucroPortas.toLocaleString("pt-BR", { 
                          minimumFractionDigits: 2 
                        })}
                      </td>
                      <td className="text-center py-4 px-2 font-semibold text-purple-600">
                        R$ {indicadores.lucroPintura.toLocaleString("pt-BR", { 
                          minimumFractionDigits: 2 
                        })}
                      </td>
                      <td className="text-center py-4 px-2 font-semibold text-cyan-600">
                        R$ {indicadores.lucroInstalacoes.toLocaleString("pt-BR", { 
                          minimumFractionDigits: 2 
                        })}
                      </td>
                      <td className="text-center py-4 px-2 font-semibold text-indigo-600">
                        R$ {indicadores.fretesTotais.toLocaleString("pt-BR", { 
                          minimumFractionDigits: 2 
                        })}
                      </td>
                      <td className="text-center py-4 px-2 font-bold text-green-600 text-lg">
                        R$ {indicadores.lucroBrutoTotal.toLocaleString("pt-BR", { 
                          minimumFractionDigits: 2 
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>


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

                <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos os atendentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os atendentes</SelectItem>
                    {atendentes.map(atendente => (
                      <SelectItem key={atendente.user_id} value={atendente.user_id}>
                        {atendente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Atendente</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead className="text-right">Valor Produtos</TableHead>
                      <TableHead className="text-right">Descontos</TableHead>
                      <TableHead className="text-right">% Desconto</TableHead>
                      <TableHead className="text-right">Custos</TableHead>
                      <TableHead className="text-right">% Margem</TableHead>
                      <TableHead className="text-right">Instalação</TableHead>
                      <TableHead className="text-right">Frete</TableHead>
                      <TableHead className="text-right">Lucro Líquido</TableHead>
                      <TableHead className="text-right">Valor Final</TableHead>
                      <TableHead className="text-right">Valor Final c/ Frete</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendas.map((venda) => (
                      <TableRow 
                        key={venda.id}
                        onDoubleClick={() => handleRowDoubleClick(venda)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        title="Clique duas vezes para ver todos os detalhes"
                      >
                        <TableCell>
                          <StatusBadge 
                            isFaturada={isFaturada(venda)} 
                            isParcial={isParcialmenteFaturada(venda)}
                          />
                        </TableCell>

                        <TableCell>
                          <span className="text-sm font-medium">{venda.cliente_nome || '-'}</span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={venda.atendente_foto || undefined} alt={venda.atendente_nome} />
                              <AvatarFallback>
                                {venda.atendente_nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{venda.atendente_nome}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <ProductIconsSummary venda={venda} />
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          R$ {((venda.valor_produto || 0) + (venda.valor_pintura || 0))
                            .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell className="text-right">
                          {calculateTotalDiscount(venda) > 0 ? (
                            <Badge variant="destructive" className="font-medium">
                              - R$ {calculateTotalDiscount(venda).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {(() => {
                            const desconto = calculateTotalDiscount(venda);
                            const valorProdutos = (venda.valor_produto || 0) + (venda.valor_pintura || 0);
                            const valorOriginal = valorProdutos + desconto;
                            const percentualDesconto = valorOriginal > 0 ? (desconto / valorOriginal) * 100 : 0;
                            
                            return desconto > 0 ? (
                              <span className="font-medium text-red-600">
                                {percentualDesconto.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            );
                          })()}
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-medium text-orange-600">
                            R$ {((venda.custo_produto || 0) + (venda.custo_pintura || 0))
                              .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          {(() => {
                            const custosTotais = (venda.custo_produto || 0) + (venda.custo_pintura || 0);
                            const valorFinal = (venda.valor_venda || 0) - (venda.valor_frete || 0);
                            const margem = custosTotais > 0 ? ((valorFinal - custosTotais) / custosTotais) * 100 : 0;
                            
                            if (custosTotais === 0) {
                              return <span className="text-muted-foreground">-</span>;
                            }
                            
                            const margemColor = margem >= 0 ? 'text-green-600' : 'text-red-600';
                            
                            return (
                              <span className={`font-semibold ${margemColor}`}>
                                {margem >= 0 ? '+' : ''}{margem.toFixed(1)}%
                              </span>
                            );
                          })()}
                        </TableCell>

                        <TableCell className="text-right">
                          R$ {(venda.valor_instalacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell className="text-right">
                          R$ {(venda.valor_frete || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell className="text-right font-semibold text-green-600">
                          {isFaturada(venda) ? (
                            (() => {
                              const portas = venda.portas || [];
                              const lucroItens = portas.reduce((sum: number, p: any) => 
                                sum + ((p.lucro_item || 0) * (p.quantidade || 1)), 0);
                              const lucroLiquido = lucroItens + (venda.valor_instalacao || 0);
                              
                              return `R$ ${lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                            })()
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-semibold text-primary">
                          R$ {((venda.valor_venda || 0) - (venda.valor_frete || 0))
                            .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          R$ {(venda.valor_venda || 0)
                            .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/faturamento/${venda.id}/editar`);
                              }}
                              title="Editar faturamento"
                            >
                              <Receipt className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  title="Excluir venda"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
      </Tabs>

      <VendaDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        venda={selectedVenda}
      />
    </div>
  );
}