
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Search, DollarSign, TrendingUp, CalendarDays, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Venda {
  id: string;
  numero_venda?: number;
  lead_id: string;
  atendente_id: string;
  valor_venda: number;
  forma_pagamento: string | null;
  observacoes_venda: string | null;
  data_venda: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  canal_aquisicao?: string;
  lead_nome: string;
  atendente_nome: string;
}

interface FaturamentoStats {
  totalVendas: number;
  valorTotal: number;
  vendasMes: number;
  valorMes: number;
}

export default function Faturamento() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [stats, setStats] = useState<FaturamentoStats>({
    totalVendas: 0,
    valorTotal: 0,
    vendasMes: 0,
    valorMes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedState, setSelectedState] = useState("");
  const { isAdmin, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin || userRole === 'gerente_comercial') {
      fetchVendas();
      fetchStats();
    }
  }, [isAdmin, userRole, selectedMonth, selectedYear, selectedState]);

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
          canal_aquisicao,
          estado,
          cidade,
          bairro,
          cep
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Faturamento</h1>
        <p className="text-muted-foreground">
          Visão geral das vendas e faturamento
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
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
                  <TableHead>Localização</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Forma Pagamento</TableHead>
                  <TableHead>Data da Venda</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 8} className="text-center text-muted-foreground">
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
                      <TableCell>
                        <div className="text-sm">
                          {venda.cidade && venda.estado ? (
                            <>
                              <div>{venda.cidade}, {venda.estado}</div>
                              <div className="text-muted-foreground">
                                {venda.bairro} - {venda.cep}
                              </div>
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
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
    </div>
  );
}
