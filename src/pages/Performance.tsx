import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Mouse, TrendingUp, Globe } from "lucide-react";
import { useSalesData, useWhatsAppRoulette } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppClick {
  id: string;
  atendente_nome: string;
  atendente_telefone: string | null;
  created_at: string;
  fbclid: string | null;
  gclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  traffic_channel: string | null;
  source: string | null;
  page_url: string | null;
  referrer: string | null;
}

interface AtendenteStats {
  nome: string;
  total_clicks: number;
}

interface CanalStats {
  canal: string;
  total_clicks: number;
}

interface ReferrerStats {
  referrer: string;
  total_clicks: number;
}

export default function Performance() {
  const [whatsAppClicks, setWhatsAppClicks] = useState<WhatsAppClick[]>([]);
  const [atendenteStats, setAtendenteStats] = useState<AtendenteStats[]>([]);
  const [canalStats, setCanalStats] = useState<CanalStats[]>([]);
  const [referrerStats, setReferrerStats] = useState<ReferrerStats[]>([]);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const today = new Date();

  // Use the corrected sales data hook
  const { data: salesData, isLoading: loadingSales } = useSalesData();
  const { data: whatsAppData } = useWhatsAppRoulette();

  useEffect(() => {
    fetchWhatsAppData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(() => {
      fetchWhatsAppData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchWhatsAppData = async () => {
    setLoadingWhatsApp(true);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    try {
      // Buscar dados dos últimos 30 dias
      const { data: clicksData, error } = await supabase
        .from("whatsapp_roulette_clicks")
        .select("*")
        .gte("created_at", `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Erro ao buscar dados da roleta:", error);
        return;
      }

      setWhatsAppClicks(clicksData || []);

      // Calcular stats por atendente
      const atendenteMap: Record<string, number> = {};
      (clicksData || []).forEach(click => {
        atendenteMap[click.atendente_nome] = (atendenteMap[click.atendente_nome] || 0) + 1;
      });

      const atendenteStatsArray = Object.entries(atendenteMap).map(([nome, total_clicks]) => ({
        nome,
        total_clicks
      })).sort((a, b) => b.total_clicks - a.total_clicks);

      setAtendenteStats(atendenteStatsArray);

      // Calcular stats por canal
      const canalMap: Record<string, number> = {};
      (clicksData || []).forEach(click => {
        let canal = 'Outros';
        
        if (click.fbclid || click.utm_source?.toLowerCase().includes('facebook') || click.utm_source?.toLowerCase().includes('meta')) {
          canal = 'Meta (Facebook/Instagram)';
        } else if (click.gclid || click.utm_source?.toLowerCase().includes('google')) {
          canal = 'Google';
        } else if (click.utm_source) {
          canal = click.utm_source;
        } else if (click.source) {
          canal = click.source;
        }

        canalMap[canal] = (canalMap[canal] || 0) + 1;
      });

      const canalStatsArray = Object.entries(canalMap).map(([canal, total_clicks]) => ({
        canal,
        total_clicks
      })).sort((a, b) => b.total_clicks - a.total_clicks);

      setCanalStats(canalStatsArray);

      // Calcular stats por referenciador
      const referrerMap: Record<string, number> = {};
      (clicksData || []).forEach(click => {
        const referrer = click.referrer ? new URL(click.referrer).hostname : 'Acesso Direto';
        referrerMap[referrer] = (referrerMap[referrer] || 0) + 1;
      });

      const referrerStatsArray = Object.entries(referrerMap).map(([referrer, total_clicks]) => ({
        referrer,
        total_clicks
      })).sort((a, b) => b.total_clicks - a.total_clicks);

      setReferrerStats(referrerStatsArray);

    } catch (error) {
      console.error("Erro ao processar dados da roleta:", error);
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const chartData = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Create a map for quick lookup
    const salesMap = salesData.reduce((acc, sale) => {
      acc[sale.data] = sale.valor;
      return acc;
    }, {} as Record<string, number>);
    
    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      data.push({
        dia: day,
        valor: salesMap[dateStr] || 0
      });
    }
    return data;
  }, [salesData]);

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Performance</h1>
        <p className="text-xl text-muted-foreground">
          Análise de vendas e roleta WhatsApp do mês de {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Gráfico de vendas diárias */}
      <div className="w-full">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
          Vendas Diárias do Mês
        </h2>
        <div className="bg-card rounded-lg p-6 shadow-lg">
          {loadingSales ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-xl text-muted-foreground">Carregando dados...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dia" 
                  label={{ value: 'Dia do Mês', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value)}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(value),
                    'Vendas'
                  ]}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                {/* Linhas de referência para os marcos de valores */}
                <ReferenceLine y={20000} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                <ReferenceLine y={50000} stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" />
                <ReferenceLine y={75000} stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" />
                
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Indicadores da Roleta WhatsApp */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cliques por Atendente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Cliques por Atendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWhatsApp ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <div className="space-y-2">
                {atendenteStats.map((atendente, index) => (
                  <div key={atendente.nome} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}º</Badge>
                      <span className="font-medium">{atendente.nome}</span>
                    </div>
                    <Badge variant="secondary">{atendente.total_clicks} cliques</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cliques por Canal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cliques por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWhatsApp ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <div className="space-y-2">
                {canalStats.map((canal, index) => (
                  <div key={canal.canal} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={canal.canal === 'Meta (Facebook/Instagram)' ? 'default' : 
                               canal.canal === 'Google' ? 'secondary' : 'outline'}
                      >
                        {canal.canal}
                      </Badge>
                    </div>
                    <Badge variant="secondary">{canal.total_clicks} cliques</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Referenciadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Ranking de Referenciadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWhatsApp ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <div className="space-y-2">
                {referrerStats.map((referrer, index) => (
                  <div key={referrer.referrer} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}º</Badge>
                      <span className="font-medium text-xs">{referrer.referrer}</span>
                    </div>
                    <Badge variant="secondary">{referrer.total_clicks} cliques</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Cliques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mouse className="h-5 w-5" />
            Histórico Recente de Cliques
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWhatsApp ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando histórico...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Referenciador</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whatsAppClicks.map((click) => {
                  let canal = 'Outros';
                  if (click.fbclid || click.utm_source?.toLowerCase().includes('facebook') || click.utm_source?.toLowerCase().includes('meta')) {
                    canal = 'Meta';
                  } else if (click.gclid || click.utm_source?.toLowerCase().includes('google')) {
                    canal = 'Google';
                  } else if (click.utm_source) {
                    canal = click.utm_source;
                  }

                  return (
                    <TableRow key={click.id}>
                      <TableCell>
                        {format(new Date(click.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{click.atendente_nome}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={canal === 'Meta' ? 'default' : 
                                 canal === 'Google' ? 'secondary' : 'outline'}
                        >
                          {canal}
                        </Badge>
                      </TableCell>
                      <TableCell>{click.atendente_telefone || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {click.referrer ? new URL(click.referrer).hostname : 'Acesso Direto'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {click.page_url ? new URL(click.page_url).hostname : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}