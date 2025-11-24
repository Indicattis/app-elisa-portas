import { Truck, CheckCircle, Clock, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function LogisticaHome() {
  const { data: entregasMetrics, isLoading: loadingEntregas } = useQuery({
    queryKey: ['entregas-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas' as any)
        .select('*');

      if (error) throw error;

      const pendentes = (data || []).filter((e: any) => e.status === 'pendente_producao').length;
      const emProducao = (data || []).filter((e: any) => ['em_producao', 'em_qualidade', 'aguardando_pintura'].includes(e.status)).length;
      const finalizadas = (data || []).filter((e: any) => e.status === 'finalizada').length;

      return {
        entregasPendentes: pendentes,
        entregasEmProducao: emProducao,
        entregasFinalizadas: finalizadas,
        totalEntregas: (data || []).length
      };
    }
  });

  const { data: ordensMetrics, isLoading: loadingOrdens } = useQuery({
    queryKey: ['ordens-carregamento-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_carregamento')
        .select('*');

      if (error) throw error;

      const pendentes = (data || []).filter((o: any) => !o.carregamento_concluido).length;
      const concluidas = (data || []).filter((o: any) => o.carregamento_concluido).length;

      return {
        ordensPendentes: pendentes,
        ordensConcluidas: concluidas,
        totalOrdens: (data || []).length
      };
    }
  });

  const chartData = [
    {
      name: 'Entregas',
      Pendentes: entregasMetrics?.entregasPendentes || 0,
      'Em Produção': entregasMetrics?.entregasEmProducao || 0,
      Finalizadas: entregasMetrics?.entregasFinalizadas || 0,
    },
    {
      name: 'Carregamentos',
      Pendentes: ordensMetrics?.ordensPendentes || 0,
      Concluídas: ordensMetrics?.ordensConcluidas || 0,
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Logística</h1>
        <p className="text-muted-foreground">Visão geral de entregas e carregamentos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entregasMetrics?.entregasPendentes || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando produção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entregasMetrics?.entregasFinalizadas || 0}</div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carregamentos Pendentes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordensMetrics?.ordensPendentes || 0}</div>
            <p className="text-xs text-muted-foreground">A serem realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Frota ativa</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral de Operações</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Pendentes" fill="hsl(var(--warning))" />
              <Bar dataKey="Em Produção" fill="hsl(var(--info))" />
              <Bar dataKey="Finalizadas" fill="hsl(var(--success))" />
              <Bar dataKey="Concluídas" fill="hsl(var(--success))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
