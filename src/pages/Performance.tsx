import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, Mouse, TrendingUp, Globe, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(new Date());
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

  const canalChartData = useMemo(() => {
    return canalStats.map(stat => ({
      canal: stat.canal,
      cliques: stat.total_clicks
    }));
  }, [canalStats]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  const clicksFiltrados = useMemo(() => {
    return whatsAppClicks.filter(click => {
      const clickDate = new Date(click.created_at);
      const inicio = new Date(dataInicio);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      return clickDate >= inicio && clickDate <= fim;
    });
  }, [whatsAppClicks, dataInicio, dataFim]);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Performance</h1>
        <p className="text-sm sm:text-base md:text-xl text-muted-foreground">
          Análise de cliques da roleta WhatsApp do mês de {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Gráfico de cliques por canal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5" />
            Cliques por Canal de Aquisição
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWhatsApp ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-muted-foreground">Carregando dados...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={canalChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="canal" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} cliques`, 'Total']}
                  contentStyle={{ fontSize: '14px' }}
                />
                <Bar dataKey="cliques" radius={[0, 4, 4, 0]}>
                  {canalChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Indicadores da Roleta WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {atendenteStats.slice(0, 10).map((atendente, index) => (
                  <div key={atendente.nome} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}º</Badge>
                      <span className="font-medium text-sm">{atendente.nome}</span>
                    </div>
                    <Badge variant="secondary">{atendente.total_clicks}</Badge>
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
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {canalStats.slice(0, 10).map((canal, index) => (
                  <div key={canal.canal} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={canal.canal === 'Meta (Facebook/Instagram)' ? 'default' : 
                               canal.canal === 'Google' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {canal.canal}
                      </Badge>
                    </div>
                    <Badge variant="secondary">{canal.total_clicks}</Badge>
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
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {referrerStats.slice(0, 10).map((referrer, index) => (
                  <div key={referrer.referrer} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}º</Badge>
                      <span className="font-medium text-xs truncate max-w-[120px]">{referrer.referrer}</span>
                    </div>
                    <Badge variant="secondary">{referrer.total_clicks}</Badge>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mouse className="h-5 w-5" />
              <CardTitle>Histórico Recente de Cliques</CardTitle>
              <Badge variant="outline">{clicksFiltrados.length}</Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataInicio, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => date && setDataInicio(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-sm text-muted-foreground">até</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataFim, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => date && setDataFim(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const hoje = new Date();
                  setDataInicio(hoje);
                  setDataFim(hoje);
                }}
              >
                Hoje
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingWhatsApp ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando histórico...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Data/Hora</TableHead>
                    <TableHead className="whitespace-nowrap">Atendente</TableHead>
                    <TableHead className="whitespace-nowrap">Canal</TableHead>
                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Telefone</TableHead>
                    <TableHead className="whitespace-nowrap hidden md:table-cell">Referenciador</TableHead>
                    <TableHead className="whitespace-nowrap hidden lg:table-cell">Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clicksFiltrados.map((click) => {
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
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(click.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{click.atendente_nome}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={canal === 'Meta' ? 'default' : 
                                   canal === 'Google' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {canal}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{click.atendente_telefone || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {click.referrer ? new URL(click.referrer).hostname : 'Acesso Direto'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {click.page_url ? new URL(click.page_url).hostname : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}