import { useEffect, useMemo, useState } from "react";
import { format, isSameMonth, isSameWeek, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getYear, isWeekend, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useVendasAgregadas, useVendasDoDia, useVendasMesAtual, useVendasSemanaAtual } from "@/hooks/useVendasDashboard";
import { Link } from "react-router-dom";

const getRangeStyle = (valor: number, weekend: boolean, isPastDate: boolean = false) => {
  if (weekend) return { base: "bg-muted text-muted-foreground", star: false, ring: "" };
  if (valor >= 75001) return { base: "bg-black text-white border-2 border-yellow-400", star: true, ring: "ring-2 ring-yellow-400" };
  if (valor >= 50001) return { base: "bg-green-600 text-white", star: false, ring: "" };
  if (valor >= 20001) return { base: "bg-yellow-500 text-black", star: false, ring: "" };
  if (valor > 0) return { base: "bg-red-600 text-white", star: false, ring: "" };
  if (isPastDate && (valor === 0 || valor === null || valor === undefined)) {
    return { base: "bg-red-600 text-white", star: false, ring: "" };
  }
  return { base: "bg-muted text-muted-foreground", star: false, ring: "" };
};

const monthsInYear = Array.from({ length: 12 }, (_, i) => i);

export default function ContadorVendas() {
  const [year, setYear] = useState(getYear(new Date()));
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'year' | 'month'>('month');
  const { toast } = useToast();

  const { data: vendasAgregadas = [], isLoading: loading } = useVendasAgregadas(year);
  const { data: vendasMes } = useVendasMesAtual();
  const { data: vendasSemana } = useVendasSemanaAtual();
  const { data: vendasDoDia = [] } = useVendasDoDia(
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ""
  );

  // Converter array para objeto para compatibilidade com código existente
  const data = useMemo(() => {
    return vendasAgregadas.reduce((acc, venda) => {
      acc[venda.data] = venda;
      return acc;
    }, {} as Record<string, { data: string; valor: number; numero_vendas: number }>);
  }, [vendasAgregadas]);

  useEffect(() => {
    document.title = "Contador de vendas";
  }, []);

  const handlePrevYear = () => setYear(y => y - 1);
  const handleNextYear = () => setYear(y => y + 1);

  const openModalForDate = (date: Date) => {
    setSelectedDate(date);
    setOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const today = new Date();
  const monthSum = vendasMes?.total || 0;
  const monthSalesCount = vendasMes?.quantidade || 0;
  const weekSum = vendasSemana?.total || 0;
  const weekSalesCount = vendasSemana?.quantidade || 0;

  const renderMonth = (monthIndex: number, large = false) => {
    const firstDay = new Date(year, monthIndex, 1);
    const monthStart = startOfMonth(firstDay);
    const monthEnd = endOfMonth(firstDay);

    const startGrid = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endGrid = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startGrid;
    while (day <= endGrid) {
      days.push(day);
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }

    const daySize = large ? 'w-28 h-28 md:w-32 md:h-32' : 'w-20 h-20 md:w-24 md:h-24';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{format(firstDay, "LLLL", { locale: ptBR })}</h3>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i} className="text-sm font-medium text-muted-foreground text-center">{d}</div>
          ))}
          {days.map((d, idx) => {
            const inMonth = isSameMonth(d, firstDay);
            const iso = format(d, "yyyy-MM-dd");
            const registro = data[iso];
            const weekend = isWeekend(d);
            const valor = registro?.valor || 0;
            const isPastDate = d < today && !isSameDay(d, today);
            const style = getRangeStyle(valor, weekend || !inMonth, isPastDate && inMonth && !weekend);
            const isToday = isSameDay(d, today);

            return (
              <div key={idx} className="flex items-center justify-center">
                <button
                  onClick={() => inMonth ? openModalForDate(d) : undefined}
                  disabled={!inMonth}
                  className={`relative ${daySize} rounded-full flex flex-col items-center justify-center shadow-sm transition-transform hover:scale-105 border border-sm ${style.base} ${style.ring} ${!inMonth ? "opacity-40" : ""} ${isToday ? "ring-2 ring-primary" : ""}`}
                  title={registro ? formatCurrency(valor) : undefined}
                >
                  <span className="text-sm opacity-90">{format(d, "d")}</span>
                  <div className="text-center">
                    <span className="text-sm font-semibold block">
                      {registro ? `R$ ${new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(valor)}` : "-"}
                    </span>
                    <span className="text-xs opacity-75">
                      {registro && registro.numero_vendas > 0 ? `${registro.numero_vendas} venda${registro.numero_vendas > 1 ? 's' : ''}` : ""}
                    </span>
                  </div>
                  {style.star && (
                    <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 drop-shadow" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Contador de vendas</h1>
          <p className="text-muted-foreground">Visualize o valor vendido por dia com base nas vendas cadastradas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrevYear} className="hover-scale" aria-label="Ano anterior"><ChevronLeft /></Button>
          <div className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-lg font-semibold" aria-live="polite">{year}</div>
          <Button variant="outline" onClick={handleNextYear} className="hover-scale" aria-label="Próximo ano"><ChevronRight /></Button>
          <div className="ml-2 inline-flex rounded-md border">
            <Button size="sm" variant={viewMode === 'month' ? 'default' : 'ghost'} onClick={() => setViewMode('month')}>Mês atual</Button>
            <Button size="sm" variant={viewMode === 'year' ? 'default' : 'ghost'} onClick={() => setViewMode('year')}>Ano</Button>
          </div>
        </div>
      </header>

      <section aria-labelledby="legendas" className="sticky top-0 z-10 bg-background border-b border-border p-4 -mx-6 mb-6">
        <div className="w-full space-y-4">
          <h2 id="legendas" className="text-lg font-semibold">Legenda de cores</h2>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-block h-6 w-6 rounded-full bg-red-600" aria-hidden="true"></span>
                <span className="text-base font-medium">0–20.000</span>
              </div>
              <span className="text-sm text-muted-foreground font-medium">Péssimo</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-block h-6 w-6 rounded-full bg-yellow-500 border border-yellow-600" aria-hidden="true"></span>
                <span className="text-base font-medium">20.001–50.000</span>
              </div>
              <span className="text-sm text-muted-foreground font-medium">Prejuízo</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-block h-6 w-6 rounded-full bg-green-600" aria-hidden="true"></span>
                <span className="text-base font-medium">50.001–75.000</span>
              </div>
              <span className="text-sm text-muted-foreground font-medium">Contas pagas</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-black border-2 border-yellow-400" aria-hidden="true"></span>
                <span className="text-base font-medium">75.001+</span>
              </div>
              <span className="text-sm text-muted-foreground font-medium">Lucro</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-medium text-center">Cores aplicadas de seg–sex. Dias passados sem vendas também ficam vermelhos.</div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {viewMode === 'year' ? monthsInYear.map((m) => renderMonth(m)) : (
          <div className="md:col-span-2 xl:col-span-3">
            {renderMonth(today.getMonth(), true)}
          </div>
        )}
      </section>

      <aside className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm text-muted-foreground">Valor - Mês</h3>
          <p className="text-2xl font-bold">{formatCurrency(monthSum)}</p>
          <p className="text-sm text-muted-foreground">{monthSalesCount} vendas</p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm text-muted-foreground">Valor - Semana</h3>
          <p className="text-2xl font-bold">{formatCurrency(weekSum)}</p>
          <p className="text-sm text-muted-foreground">{weekSalesCount} vendas</p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm text-muted-foreground">Ticket Médio - Mês</h3>
          <p className="text-2xl font-bold">
            {monthSalesCount > 0 ? formatCurrency(monthSum / monthSalesCount) : 'R$ 0,00'}
          </p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm text-muted-foreground">Ticket Médio - Semana</h3>
          <p className="text-2xl font-bold">
            {weekSalesCount > 0 ? formatCurrency(weekSum / weekSalesCount) : 'R$ 0,00'}
          </p>
        </div>
      </aside>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Vendas do dia {selectedDate && format(selectedDate, "PPP", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          {vendasDoDia.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda registrada neste dia.
            </div>
          ) : (
            <div className="space-y-3">
              {vendasDoDia.map((venda) => (
                <Card key={venda.id} className="p-4 hover:bg-accent transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold text-lg">{venda.cliente_nome}</div>
                      <div className="text-sm text-muted-foreground">
                        Atendente: {venda.atendente_nome || "Não informado"}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="font-bold text-lg text-primary">
                        {formatCurrency(venda.valor_venda)}
                      </div>
                      <Link to={`/dashboard/vendas/${venda.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          Ver Detalhes
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total do dia:</span>
                  <span className="text-primary">
                    {formatCurrency(vendasDoDia.reduce((sum, v) => sum + v.valor_venda, 0))}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1 text-right">
                  {vendasDoDia.length} {vendasDoDia.length === 1 ? "venda" : "vendas"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
