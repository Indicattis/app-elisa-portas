import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, DollarSign, TrendingUp, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Venda {
  id: string;
  lead_id: string;
  atendente_id: string;
  valor_venda: number;
  forma_pagamento: string | null;
  observacoes_venda: string | null;
  data_venda: string;
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
  const { isAdmin, userRole } = useAuth();

  useEffect(() => {
    if (isAdmin || userRole === 'gerente_comercial') {
      fetchVendas();
      fetchStats();
    }
  }, [isAdmin, userRole]);

  const fetchVendas = async () => {
    try {
      const { data: vendasData, error: vendasError } = await supabase
        .from("vendas")
        .select(`
          id,
          lead_id,
          atendente_id,
          valor_venda,
          forma_pagamento,
          observacoes_venda,
          data_venda
        `)
        .order("data_venda", { ascending: false });

      if (vendasError) throw vendasError;

      if (!vendasData || vendasData.length === 0) {
        setVendas([]);
        return;
      }

      // Buscar nomes dos leads
      const leadIds = [...new Set(vendasData.map(venda => venda.lead_id))];
      const { data: leadsData } = await supabase
        .from("elisaportas_leads")
        .select("id, nome")
        .in("id", leadIds);

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set(vendasData.map(venda => venda.atendente_id))];
      const { data: atendentesData } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .in("user_id", atendenteIds);

      // Criar maps para facilitar a busca
      const leadMap = new Map(leadsData?.map(lead => [lead.id, lead.nome]) || []);
      const atendenteMap = new Map(atendentesData?.map(atendente => [atendente.user_id, atendente.nome]) || []);

      // Combinar dados
      const vendasCompletas = vendasData.map(venda => ({
        ...venda,
        lead_nome: leadMap.get(venda.lead_id) || "Lead não encontrado",
        atendente_nome: atendenteMap.get(venda.atendente_id) || "Atendente não encontrado"
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
      const { data: vendasData, error } = await supabase
        .from("vendas")
        .select("valor_venda, data_venda");

      if (error) throw error;

      if (!vendasData || vendasData.length === 0) {
        setStats({
          totalVendas: 0,
          valorTotal: 0,
          vendasMes: 0,
          valorMes: 0,
        });
        return;
      }

      const totalVendas = vendasData.length;
      const valorTotal = vendasData.reduce((acc, venda) => acc + venda.valor_venda, 0);

      // Vendas do mês atual
      const mesAtual = new Date();
      const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
      const vendasMes = vendasData.filter(venda => new Date(venda.data_venda) >= inicioMes);
      const vendasMesCount = vendasMes.length;
      const valorMes = vendasMes.reduce((acc, venda) => acc + venda.valor_venda, 0);

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
      title: "Total de Vendas",
      value: stats.totalVendas,
      description: "Vendas realizadas",
      icon: CalendarDays,
      color: "text-blue-600",
    },
    {
      title: "Faturamento Total",
      value: `R$ ${stats.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: "Valor total faturado",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Vendas do Mês",
      value: stats.vendasMes,
      description: "Vendas realizadas este mês",
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: "Faturamento do Mês",
      value: `R$ ${stats.valorMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: "Valor faturado este mês",
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
            {filteredVendas.length} vendas encontradas
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, atendente ou forma de pagamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Forma Pagamento</TableHead>
                  <TableHead>Data da Venda</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">
                        {venda.lead_nome}
                      </TableCell>
                      <TableCell>{venda.atendente_nome}</TableCell>
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
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {venda.observacoes_venda || "-"}
                        </div>
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
  );
}