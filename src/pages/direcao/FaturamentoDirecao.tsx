import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, DollarSign, TrendingUp, CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { ProductIconsSummary } from "@/components/vendas/ProductIconsSummary";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Venda {
  id: string;
  data_venda: string;
  atendente_id: string;
  atendente_nome: string;
  atendente_foto?: string | null;
  cliente_nome: string | null;
  cidade: string | null;
  estado: string | null;
  valor_venda: number;
  valor_credito?: number;
  valor_frete: number;
  frete_aprovado?: boolean;
  portas?: any[];
}

export default function FaturamentoDirecao() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'todas' | 'faturadas' | 'nao_faturadas'>('todas');
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [atendentes, setAtendentes] = useState<any[]>([]);
  const navigate = useNavigate();

  const isFaturada = (venda: Venda) => {
    const portas = venda.portas || [];
    if (portas.length === 0) return false;
    const freteAprovado = venda.frete_aprovado === true;
    const todosProdutosFaturados = portas.every((p: any) => p.faturamento === true);
    return freteAprovado && todosProdutosFaturados;
  };

  useEffect(() => {
    fetchVendas();
    fetchAtendentes();
  }, [dateRange]);

  const fetchAtendentes = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id, nome')
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
          estado,
          cidade,
          cliente_nome,
          valor_venda,
          valor_credito,
          valor_frete,
          frete_aprovado,
          produtos_vendas (
            id,
            tipo_produto,
            descricao,
            valor_produto,
            quantidade,
            faturamento
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

      const { data: todosUsuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url");

      const atendenteMap = new Map();
      if (todosUsuarios) {
        todosUsuarios.forEach(user => {
          atendenteMap.set(user.user_id, { nome: user.nome, foto: user.foto_perfil_url });
        });
      }

      const vendasCompletas = vendasData.map((venda: any) => {
        const atendenteData = venda.atendente_id ? atendenteMap.get(venda.atendente_id) : null;
        return {
          ...venda,
          atendente_nome: atendenteData?.nome || "Não encontrado",
          atendente_foto: atendenteData?.foto || null,
          portas: venda.produtos_vendas || [],
        };
      });

      setVendas(vendasCompletas);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendas = useMemo(() => {
    return vendas.filter(venda => {
      if (activeTab === 'faturadas' && !isFaturada(venda)) return false;
      if (activeTab === 'nao_faturadas' && isFaturada(venda)) return false;

      if (selectedAtendente !== "todos" && venda.atendente_id !== selectedAtendente) {
        return false;
      }

      const matchesSearch = 
        (venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (venda.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [vendas, activeTab, selectedAtendente, searchTerm]);

  const stats = useMemo(() => {
    const faturadas = filteredVendas.filter(isFaturada);
    const naoFaturadas = filteredVendas.filter(v => !isFaturada(v));
    
    return {
      faturamento: filteredVendas.reduce((acc, v) => 
        acc + ((v.valor_venda || 0) + (v.valor_credito || 0)), 0),
      faturadas: faturadas.length,
      naoFaturadas: naoFaturadas.length,
    };
  }, [filteredVendas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <MinimalistLayout title="Faturamento" backPath="/direcao">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout 
      title="Faturamento" 
      subtitle="Gestão de vendas para faturar"
      backPath="/direcao"
    >
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Faturamento</p>
              <p className="text-base sm:text-xl font-bold text-white">{formatCurrency(stats.faturamento)}</p>
            </div>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Faturadas</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.faturadas}</p>
            </div>
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400/60" />
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-400">{stats.naoFaturadas}</p>
            </div>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400/60" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="todas" className="data-[state=active]:bg-white/10 text-white">
            Todas
          </TabsTrigger>
          <TabsTrigger value="faturadas" className="data-[state=active]:bg-white/10 text-white">
            Faturadas
          </TabsTrigger>
          <TabsTrigger value="nao_faturadas" className="data-[state=active]:bg-white/10 text-white">
            Não Faturadas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar cliente, vendedor, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
              className="text-white"
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="todos" className="text-white">Todos</SelectItem>
            {atendentes.map(atendente => (
              <SelectItem key={atendente.user_id} value={atendente.user_id} className="text-white">
                {atendente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Data</TableHead>
              <TableHead className="text-white/60">Cliente</TableHead>
              <TableHead className="text-white/60 hidden md:table-cell">Vendedor</TableHead>
              <TableHead className="text-white/60">Produtos</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
              <TableHead className="text-white/60 text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-white/40">
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredVendas.map((venda) => (
                <TableRow 
                  key={venda.id} 
                  className="border-white/10 hover:bg-white/5 cursor-pointer"
                  onClick={() => navigate(`/dashboard/vendas/${venda.id}`)}
                >
                  <TableCell className="text-white/80">
                    {format(new Date(venda.data_venda), 'dd/MM/yy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {venda.cliente_nome}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={venda.atendente_foto || undefined} />
                        <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">
                          {venda.atendente_nome?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/80 text-sm">{venda.atendente_nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProductIconsSummary venda={venda} />
                  </TableCell>
                  <TableCell>
                    {isFaturada(venda) ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Faturada
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-white font-medium">
                    {formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </MinimalistLayout>
  );
}
