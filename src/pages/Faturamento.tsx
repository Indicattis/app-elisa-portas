
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Search, DollarSign, TrendingUp, CalendarDays, Edit, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RequisicoesVenda } from "@/components/RequisicoesVenda";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Venda {
  id: string;
  numero_venda?: number;
  lead_id: string;
  atendente_id: string;
  valor_venda: number;
  forma_pagamento: string | null;
  observacoes_venda: string | null;
  data_venda: string;
  canal_aquisicao?: string;
  lead_nome: string;
  atendente_nome: string;
}

interface FaturamentoStats {
  totalVendas: number;
  valorTotal: number;
  vendasMes: number;
  valorMes: number;
  orcamentosPendentes: number;
  requisicoesVendaPendentes: number;
}

interface OrcamentoRequisicao {
  id: string;
  status: string;
  valor_total: number;
  created_at: string;
  lead_nome: string;
  solicitante_nome: string;
  requer_analise: boolean;
}

export default function Faturamento() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [orcamentosRequisicoes, setOrcamentosRequisicoes] = useState<OrcamentoRequisicao[]>([]);
  const [stats, setStats] = useState<FaturamentoStats>({
    totalVendas: 0,
    valorTotal: 0,
    vendasMes: 0,
    valorMes: 0,
    orcamentosPendentes: 0,
    requisicoesVendaPendentes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { isAdmin, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin || userRole === 'gerente_comercial') {
      fetchVendas();
      fetchStats();
      fetchOrcamentosRequisicoes();
    }
  }, [isAdmin, userRole, selectedMonth, selectedYear]);

  const fetchVendas = async () => {
    try {
      let query = supabase
        .from("vendas")
        .select(`
          id,
          lead_id,
          atendente_id,
          valor_venda,
          forma_pagamento,
          observacoes_venda,
          data_venda,
          created_at,
          canal_aquisicao
        `)
        .order("created_at", { ascending: false });

      // Filtrar por mês e ano
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      
      query = query
        .gte("data_venda", startDate.toISOString())
        .lte("data_venda", endDate.toISOString());

      const { data: vendasData, error: vendasError } = await query;

      if (vendasError) {
        console.error("Erro ao buscar vendas:", vendasError);
        throw vendasError;
      }

      if (!vendasData || vendasData.length === 0) {
        setVendas([]);
        return;
      }

      // Buscar nomes dos leads
      const leadIds = [...new Set((vendasData as any[]).map(venda => venda.lead_id))];
      const { data: leadsData } = await supabase
        .from("elisaportas_leads")
        .select("id, nome")
        .in("id", leadIds);

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set((vendasData as any[]).map(venda => venda.atendente_id))];
      const { data: atendentesData } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .in("user_id", atendenteIds);

      // Criar maps para facilitar a busca
      const leadMap = new Map(leadsData?.map(lead => [lead.id, lead.nome]) || []);
      const atendenteMap = new Map(atendentesData?.map(atendente => [atendente.user_id, atendente.nome]) || []);

      // Combinar dados e adicionar número sequencial baseado na data
      const vendasCompletas = (vendasData as any[])
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((venda, index) => ({
          ...venda,
          numero_venda: index + 1,
          lead_nome: leadMap.get(venda.lead_id) || "Lead não encontrado",
          atendente_nome: atendenteMap.get(venda.atendente_id) || "Atendente não encontrado"
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setVendas(vendasCompletas);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrcamentosRequisicoes = async () => {
    try {
      const { data: orcamentos, error } = await supabase
        .from("orcamentos")
        .select(`
          id,
          status,
          valor_total,
          created_at,
          requer_analise,
          usuario_id,
          elisaportas_leads!inner(nome)
        `)
        .eq("status", "pendente")
        .eq("requer_analise", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar nomes dos solicitantes
      const userIds = [...new Set(orcamentos?.map(orc => orc.usuario_id) || [])];
      const { data: usersData } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .in("user_id", userIds);

      const userMap = new Map(usersData?.map(user => [user.user_id, user.nome]) || []);

      const orcamentosCompletos = orcamentos?.map(orc => ({
        ...orc,
        lead_nome: (orc.elisaportas_leads as any).nome,
        solicitante_nome: userMap.get(orc.usuario_id) || "Usuário não encontrado"
      })) || [];

      setOrcamentosRequisicoes(orcamentosCompletos);
    } catch (error) {
      console.error("Erro ao buscar orçamentos pendentes:", error);
    }
  };

  const fetchStats = async () => {
    try {
      // Stats para o mês selecionado
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

      const { data: vendasMes, error: errorMes } = await supabase
        .from("vendas")
        .select("valor_venda, data_venda")
        .gte("data_venda", startDate.toISOString())
        .lte("data_venda", endDate.toISOString());

      // Stats gerais (todos os dados)
      const { data: vendasTotais, error: errorTotal } = await supabase
        .from("vendas")
        .select("valor_venda, data_venda");

      // Contar orçamentos pendentes
      const { count: orcamentosPendentes } = await supabase
        .from("orcamentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");

      // Contar requisições de venda pendentes
      const { count: requisicoesVendaPendentes } = await supabase
        .from("requisicoes_venda")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");

      if (errorMes || errorTotal) throw errorMes || errorTotal;

      const vendasMesCount = vendasMes?.length || 0;
      const valorMes = vendasMes?.reduce((acc, venda) => acc + venda.valor_venda, 0) || 0;

      const totalVendas = vendasTotais?.length || 0;
      const valorTotal = vendasTotais?.reduce((acc, venda) => acc + venda.valor_venda, 0) || 0;

      setStats({
        totalVendas,
        valorTotal,
        vendasMes: vendasMesCount,
        valorMes,
        orcamentosPendentes: orcamentosPendentes || 0,
        requisicoesVendaPendentes: requisicoesVendaPendentes || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const filteredVendas = vendas.filter(venda =>
    venda.lead_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (venda.forma_pagamento && venda.forma_pagamento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Gerar opções de mês e ano
  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!isAdmin && userRole !== 'gerente_comercial') {
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

  const statCards = [
    {
      title: "Total de Vendas (Geral)",
      value: stats.totalVendas,
      description: "Vendas realizadas (todos os períodos)",
      icon: CalendarDays,
      color: "text-blue-600",
    },
    {
      title: "Faturamento Total (Geral)",
      value: `R$ ${stats.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: "Valor total faturado (todos os períodos)",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: `Vendas - ${meses.find(m => m.value === selectedMonth)?.label}/${selectedYear}`,
      value: stats.vendasMes,
      description: "Vendas do período selecionado",
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: `Faturamento - ${meses.find(m => m.value === selectedMonth)?.label}/${selectedYear}`,
      value: `R$ ${stats.valorMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: "Valor do período selecionado",
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Orçamentos Pendentes",
      value: stats.orcamentosPendentes,
      description: "Aguardando aprovação gerencial",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Requisições de Venda",
      value: stats.requisicoesVendaPendentes,
      description: "Pendentes de aprovação",
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Faturamento</h1>
        <p className="text-muted-foreground">
          Visão geral das vendas e faturamento
        </p>
      </div>

      <Tabs defaultValue="faturamento" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="orcamentos-pendentes">
            Orçamentos Pendentes
            {stats.orcamentosPendentes > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.orcamentosPendentes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requisicoes">
            Requisições de Venda
            {stats.requisicoesVendaPendentes > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.requisicoesVendaPendentes}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faturamento" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.slice(0, 4).map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>
                {filteredVendas.length} vendas encontradas no período selecionado
              </CardDescription>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, atendente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value.toString()}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
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
                      <TableHead>Nº Venda</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Atendente</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Forma Pagamento</TableHead>
                      <TableHead>Data da Venda</TableHead>
                      {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground">
                          Nenhuma venda encontrada no período selecionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVendas.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell className="font-bold text-primary">
                            #{venda.numero_venda || 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {venda.lead_nome}
                          </TableCell>
                          <TableCell>{venda.atendente_nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {venda.canal_aquisicao || "Google"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            R$ {venda.valor_venda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {venda.forma_pagamento ? (
                              <Badge variant="outline">
                                {venda.forma_pagamento.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(venda.data_venda), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/dashboard/vendas/${venda.id}/editar`)}
                                title="Editar venda"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos-pendentes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Orçamentos Pendentes de Aprovação
              </CardTitle>
              <CardDescription>
                Orçamentos que requerem análise gerencial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Data da Solicitação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentosRequisicoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum orçamento pendente
                        </TableCell>
                      </TableRow>
                    ) : (
                      orcamentosRequisicoes.map((orcamento) => (
                        <TableRow key={orcamento.id}>
                          <TableCell className="font-medium">
                            {orcamento.lead_nome}
                          </TableCell>
                          <TableCell>{orcamento.solicitante_nome}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            R$ {orcamento.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(orcamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => navigate("/dashboard/orcamentos")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Analisar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requisicoes" className="space-y-6">
          <RequisicoesVenda />
        </TabsContent>
      </Tabs>
    </div>
  );
}
