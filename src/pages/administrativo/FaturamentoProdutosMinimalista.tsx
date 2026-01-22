import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  CalendarIcon, 
  DoorOpen, 
  Package, 
  Wrench, 
  Palette, 
  TrendingUp,
  DollarSign,
  Target
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { useFaturamentoPorProduto } from "@/hooks/useFaturamentoPorProduto";
import { supabase } from "@/integrations/supabase/client";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getTipoProdutoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    'porta': 'Porta',
    'porta_enrolar': 'Porta de Enrolar',
    'pintura_epoxi': 'Pintura Epóxi',
    'manutencao': 'Manutenção',
    'acessorios': 'Acessórios',
  };
  return labels[tipo] || tipo;
};

const getTipoProdutoIcon = (tipo: string) => {
  const icons: Record<string, { icon: typeof DoorOpen; color: string }> = {
    'porta': { icon: DoorOpen, color: 'text-amber-400' },
    'porta_enrolar': { icon: DoorOpen, color: 'text-slate-400' },
    'pintura_epoxi': { icon: Palette, color: 'text-purple-400' },
    'manutencao': { icon: Wrench, color: 'text-cyan-400' },
    'acessorios': { icon: Package, color: 'text-blue-400' },
  };
  return icons[tipo] || { icon: Package, color: 'text-white/60' };
};

export default function FaturamentoProdutosMinimalista() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [atendentes, setAtendentes] = useState<any[]>([]);

  const { data: produtos = [], isLoading } = useFaturamentoPorProduto({
    dateRange,
    selectedAtendente,
    filterPublico: "todos"
  });

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchAtendentes();
  }, []);

  const fetchAtendentes = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id, nome')
      .order('nome');
    if (data) setAtendentes(data);
  };

  const totais = produtos.reduce(
    (acc, p) => ({
      quantidade: acc.quantidade + p.quantidade,
      faturamento: acc.faturamento + p.valor_total,
      lucro: acc.lucro + p.lucro_total,
    }),
    { quantidade: 0, faturamento: 0, lucro: 0 }
  );

  const margemTotal = totais.faturamento > 0 
    ? (totais.lucro / totais.faturamento) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 bg-white/10" />
          <Skeleton className="h-24 bg-white/10" />
          <Skeleton className="h-24 bg-white/10" />
          <Skeleton className="h-24 bg-white/10" />
        </div>
        <Skeleton className="h-96 bg-white/10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Financeiro", path: "/administrativo/financeiro" },
          { label: "Faturamento", path: "/administrativo/financeiro/faturamento" },
          { label: "Por Produto" }
        ]} 
        mounted={mounted} 
      />

      {/* Menu de Perfil Flutuante */}
      <FloatingProfileMenu mounted={mounted} />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/administrativo/financeiro/faturamento')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg shadow-green-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      <div className="container mx-auto p-6 pt-20 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faturamento por Produto</h1>
            <p className="text-white/60">Análise de faturamento e lucro por tipo de produto</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(totais.faturamento)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Lucro Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totais.lucro)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Margem Média</CardTitle>
              <Target className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                margemTotal >= 20 ? "text-emerald-400" : margemTotal >= 10 ? "text-amber-400" : "text-red-400"
              )}>
                {margemTotal.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Itens</CardTitle>
              <Package className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totais.quantidade}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                <SelectTrigger className="w-[200px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Atendente" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="todos" className="text-white">Todos atendentes</SelectItem>
                  {atendentes.map((at) => (
                    <SelectItem key={at.user_id} value={at.user_id} className="text-white">{at.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                      !dateRange && "text-white/50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Cards por Tipo de Produto */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {produtos.map((produto) => {
                const { icon: Icon, color } = getTipoProdutoIcon(produto.tipo_produto);
                const margem = produto.valor_total > 0 
                  ? (produto.lucro_total / produto.valor_total) * 100 
                  : 0;
                
                return (
                  <div 
                    key={produto.tipo_produto}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn("h-5 w-5", color)} />
                      <span className="text-sm font-medium text-white/80">
                        {getTipoProdutoLabel(produto.tipo_produto)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-white">{formatCurrency(produto.valor_total)}</p>
                      <p className={cn(
                        "text-sm font-medium",
                        margem >= 20 ? "text-emerald-400" : margem >= 10 ? "text-amber-400" : "text-red-400"
                      )}>
                        {margem.toFixed(1)}% margem
                      </p>
                      <p className="text-xs text-white/50">{produto.quantidade} itens</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70">Produto</TableHead>
                    <TableHead className="text-white/70 text-right">Quantidade</TableHead>
                    <TableHead className="text-white/70 text-right">Faturamento</TableHead>
                    <TableHead className="text-white/70 text-right">Lucro</TableHead>
                    <TableHead className="text-white/70 text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-white/50 py-8">
                        Nenhum produto encontrado no período selecionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {produtos.map((produto) => {
                        const { icon: Icon, color } = getTipoProdutoIcon(produto.tipo_produto);
                        const margem = produto.valor_total > 0 
                          ? (produto.lucro_total / produto.valor_total) * 100 
                          : 0;

                        return (
                          <TableRow key={produto.tipo_produto} className="border-white/10 hover:bg-white/5">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", color)} />
                                <span className="font-medium text-white">
                                  {getTipoProdutoLabel(produto.tipo_produto)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-white font-medium">
                              {produto.quantidade}
                            </TableCell>
                            <TableCell className="text-right text-blue-400 font-semibold">
                              {formatCurrency(produto.valor_total)}
                            </TableCell>
                            <TableCell className="text-right text-emerald-400 font-semibold">
                              {formatCurrency(produto.lucro_total)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "font-medium",
                                margem >= 20 ? "text-emerald-400" : margem >= 10 ? "text-amber-400" : "text-red-400"
                              )}>
                                {margem.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Linha de Totais */}
                      <TableRow className="bg-white/5 font-bold border-white/10">
                        <TableCell className="text-white">Total</TableCell>
                        <TableCell className="text-right text-white">
                          {totais.quantidade}
                        </TableCell>
                        <TableCell className="text-right text-blue-400">
                          {formatCurrency(totais.faturamento)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400">
                          {formatCurrency(totais.lucro)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            margemTotal >= 20 ? "text-emerald-400" : margemTotal >= 10 ? "text-amber-400" : "text-red-400"
                          )}>
                            {margemTotal.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
