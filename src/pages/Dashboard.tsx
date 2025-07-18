
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Clock, CheckCircle, AlertCircle, DollarSign, TrendingUp, Target, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  faturamentoMes: number;
  metaMinima: number;
  metaIdeal: number;
  superMeta: number;
  totalVendas: number;
  ticketMedio: number;
  totalUsuarios?: number;
}

interface VendaRecente {
  id: string;
  data_venda: string;
  cliente_nome: string;
  valor_venda: number;
  atendente_nome: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    faturamentoMes: 0,
    metaMinima: 1000000, // R$ 1.000.000,00
    metaIdeal: 1500000,  // R$ 1.500.000,00
    superMeta: 2000000,  // R$ 2.000.000,00
    totalVendas: 0,
    ticketMedio: 0,
    totalUsuarios: 0,
  });
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchVendasRecentes();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Buscar total de usuários
      const { count: totalUsuarios, error: usersError } = await supabase
        .from("admin_users")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Buscar faturamento do mês atual
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const { data: vendasMes, error: vendasMesError } = await supabase
        .from("vendas")
        .select("valor_venda")
        .gte("data_venda", startOfMonth.toISOString());

      if (vendasMesError) throw vendasMesError;

      const faturamentoMes = vendasMes?.reduce((acc, venda) => acc + (venda.valor_venda || 0), 0) || 0;
      const totalVendas = vendasMes?.length || 0;
      const ticketMedio = totalVendas > 0 ? faturamentoMes / totalVendas : 0;

      setStats({
        faturamentoMes,
        metaMinima: 1000000,
        metaIdeal: 1500000,
        superMeta: 2000000,
        totalVendas,
        ticketMedio,
        totalUsuarios: totalUsuarios || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const fetchVendasRecentes = async () => {
    try {
      const { data: vendasData, error } = await supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          cliente_nome,
          valor_venda,
          atendente_id
        `)
        .order("data_venda", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set(vendasData?.map(venda => venda.atendente_id).filter(Boolean))];
      let atendenteMap = new Map();
      
      if (atendenteIds.length > 0) {
        const { data: atendenteData } = await supabase
          .from("admin_users")
          .select("user_id, nome")
          .in("user_id", atendenteIds);

        if (atendenteData) {
          atendenteData.forEach((atendente: any) => {
            atendenteMap.set(atendente.user_id, atendente.nome);
          });
        }
      }

      const vendasComNomes = vendasData?.map(venda => ({
        ...venda,
        atendente_nome: atendenteMap.get(venda.atendente_id) || "Atendente não encontrado"
      })) || [];

      setVendasRecentes(vendasComNomes);
    } catch (error) {
      console.error("Erro ao buscar vendas recentes:", error);
    }
  };

  const progressoMetaMinima = (stats.faturamentoMes / stats.metaMinima) * 100;
  const progressoMetaIdeal = (stats.faturamentoMes / stats.metaIdeal) * 100;
  const progressoSuperMeta = (stats.faturamentoMes / stats.superMeta) * 100;

  const getMetaStatus = () => {
    if (stats.faturamentoMes >= stats.superMeta) return { label: "🚀 Super Meta Atingida!", color: "text-purple-600", bgColor: "bg-purple-100" };
    if (stats.faturamentoMes >= stats.metaIdeal) return { label: "🎯 Meta Ideal Atingida!", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (stats.faturamentoMes >= stats.metaMinima) return { label: "✅ Meta Mínima Atingida!", color: "text-green-600", bgColor: "bg-green-100" };
    return { label: "📈 Trabalhando para a meta", color: "text-orange-600", bgColor: "bg-orange-100" };
  };

  const metaStatus = getMetaStatus();

  const statCards = [
    {
      title: "Faturamento Mensal",
      value: `R$ ${stats.faturamentoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: `Mês de ${format(new Date(), "MMMM", { locale: ptBR })}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total de Vendas",
      value: stats.totalVendas,
      description: "Vendas realizadas no mês",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${stats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: "Valor médio por venda",
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Total de Usuários",
      value: stats.totalUsuarios,
      description: "Usuários cadastrados",
      icon: Users,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de leads e faturamento
        </p>
      </div>

      {/* Metas Mensais */}
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            Progresso das Metas Mensais
          </CardTitle>
          <CardDescription>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${metaStatus.bgColor} ${metaStatus.color}`}>
              {metaStatus.label}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Meta Mínima */}
          <div className="space-y-4 p-4 rounded-lg border bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Meta Mínima</h4>
                  <p className="text-3xl font-bold text-green-600">
                    {progressoMetaMinima.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">R$ 1.000.000,00</p>
                <p className="text-sm text-muted-foreground">
                  R$ {stats.faturamentoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Progress 
              value={Math.min(progressoMetaMinima, 100)} 
              className="h-4 bg-green-100"
              style={{
                '--progress-background': 'hsl(var(--primary))',
                animation: 'scale-in 0.5s ease-out'
              } as React.CSSProperties}
            />
          </div>

          {/* Meta Ideal */}
          <div className="space-y-4 p-4 rounded-lg border bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-blue-600">Meta Ideal</h4>
                  <p className="text-3xl font-bold text-blue-600">
                    {progressoMetaIdeal.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">R$ 1.500.000,00</p>
                <p className="text-sm text-muted-foreground">
                  Faltam R$ {Math.max(0, stats.metaIdeal - stats.faturamentoMes).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Progress 
              value={Math.min(progressoMetaIdeal, 100)} 
              className="h-4 bg-blue-100"
              style={{
                '--progress-background': 'hsl(217, 91%, 60%)',
                animation: 'scale-in 0.5s ease-out 0.1s both'
              } as React.CSSProperties}
            />
          </div>

          {/* Super Meta */}
          <div className="space-y-4 p-4 rounded-lg border bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-purple-600">Super Meta</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {progressoSuperMeta.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">R$ 2.000.000,00</p>
                <p className="text-sm text-muted-foreground">
                  Faltam R$ {Math.max(0, stats.superMeta - stats.faturamentoMes).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Progress 
              value={Math.min(progressoSuperMeta, 100)} 
              className="h-4 bg-purple-100"
              style={{
                '--progress-background': 'hsl(271, 81%, 56%)',
                animation: 'scale-in 0.5s ease-out 0.2s both'
              } as React.CSSProperties}
            />
          </div>
        </CardContent>
      </Card>

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>
              Últimas vendas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {vendasRecentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma venda recente</p>
              ) : (
                vendasRecentes.map((venda) => (
                  <div key={venda.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">
                          {venda.cliente_nome || "Cliente não informado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Por {venda.atendente_nome} • {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        R$ {(venda.valor_venda || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Performance</CardTitle>
            <CardDescription>
              Indicadores de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Status das Metas</span>
                <span className={`text-xs px-2 py-1 rounded-full ${metaStatus.bgColor} ${metaStatus.color}`}>
                  {stats.faturamentoMes >= stats.metaMinima ? "Atingida" : "Em Progresso"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Vendas no Mês</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {stats.totalVendas} vendas
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Performance</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  progressoMetaMinima >= 100 
                    ? "bg-green-100 text-green-800" 
                    : progressoMetaMinima >= 50
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {progressoMetaMinima >= 100 ? "Excelente" : progressoMetaMinima >= 50 ? "Boa" : "Precisa Melhorar"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
