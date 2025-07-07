import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalLeads: number;
  leadsAguardando: number;
  leadsEmAndamento: number;
  leadsConcluidos: number;
  totalUsuarios?: number;
}

interface LogAtividade {
  id: string;
  acao: string;
  created_at: string;
  lead_id: string;
  atendente_nome?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    leadsAguardando: 0,
    leadsEmAndamento: 0,
    leadsConcluidos: 0,
    totalUsuarios: 0,
  });
  const [logs, setLogs] = useState<LogAtividade[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchLogs();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Buscar estatísticas de leads
      const { data: leads, error: leadsError } = await supabase
        .from("elisaportas_leads")
        .select("status_atendimento");

      if (leadsError) throw leadsError;

      // Buscar total de usuários
      const { count: totalUsuarios, error: usersError } = await supabase
        .from("admin_users")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      const leadsAguardando = leads?.filter(lead => lead.status_atendimento === 1).length || 0;
      const leadsEmAndamento = leads?.filter(lead => lead.status_atendimento === 2).length || 0;
      const leadsPausados = leads?.filter(lead => lead.status_atendimento === 3).length || 0;
      const leadsConcluidos = leads?.filter(lead => lead.status_atendimento === 4).length || 0;

      setStats({
        totalLeads: leads?.length || 0,
        leadsAguardando,
        leadsEmAndamento: leadsEmAndamento + leadsPausados,
        leadsConcluidos,
        totalUsuarios: totalUsuarios || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from("lead_atendimento_historico")
        .select(`
          id,
          acao,
          created_at,
          lead_id,
          atendente_id
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set(logsData?.map(log => log.atendente_id).filter(Boolean))];
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

      const logsComNomes = logsData?.map(log => ({
        ...log,
        atendente_nome: atendenteMap.get(log.atendente_id) || "Sistema"
      })) || [];

      setLogs(logsComNomes);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    }
  };

  const statCards = [
    {
      title: "Total de Leads",
      value: stats.totalLeads,
      description: "Leads cadastrados no sistema",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Aguardando Atendimento",
      value: stats.leadsAguardando,
      description: "Leads aguardando atendimento",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Em Andamento",
      value: stats.leadsEmAndamento,
      description: "Leads sendo atendidos",
      icon: AlertCircle,
      color: "text-yellow-600",
    },
    {
      title: "Concluídos",
      value: stats.leadsConcluidos,
      description: "Leads finalizados",
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de leads
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
        
        {stats.totalUsuarios !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">
                Usuários cadastrados
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas alterações nos leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {log.atendente_nome} {log.acao.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Autenticação</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Ativo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}