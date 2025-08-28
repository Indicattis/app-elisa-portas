import { useEffect, useMemo, useState } from "react";
import { format, isSameMonth, isSameWeek, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, startOfYear, endOfYear, getYear, isWeekend, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DiaVenda {
  id?: string;
  data: string; // ISO date string
  valor: number;
}

interface VendaAtendente {
  atendente_id: string;
  nome: string;
  valor: number;
}

const getRangeStyle = (valor: number, weekend: boolean, isPastDate: boolean = false) => {
  if (weekend) return { base: "bg-muted text-muted-foreground", star: false, ring: "" };
  if (valor >= 75001) return { base: "bg-black text-white border-2 border-yellow-400", star: true, ring: "ring-2 ring-yellow-400" };
  if (valor >= 50001) return { base: "bg-green-600 text-white", star: false, ring: "" };
  if (valor >= 20001) return { base: "bg-yellow-500 text-black", star: false, ring: "" };
  if (valor > 0) return { base: "bg-red-600 text-white", star: false, ring: "" };
  // Dias passados com valor 0 ou null ficam vermelhos
  if (isPastDate && (valor === 0 || valor === null || valor === undefined)) {
    return { base: "bg-red-600 text-white", star: false, ring: "" };
  }
  return { base: "bg-muted text-muted-foreground", star: false, ring: "" };
};

const monthsInYear = Array.from({ length: 12 }, (_, i) => i);

export default function ContadorVendas() {
  const [year, setYear] = useState(getYear(new Date()));
  const [data, setData] = useState<Record<string, DiaVenda>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [inputValor, setInputValor] = useState<string>("");
  const [viewMode, setViewMode] = useState<'year' | 'month'>('month');
  const [vendasAtendentes, setVendasAtendentes] = useState<VendaAtendente[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Contador de vendas";
  }, []);

  const fetchYear = async (y: number) => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("contador_vendas_dias")
      .select("id, data, valor")
      .gte("data", `${y}-01-01`)
      .lte("data", `${y}-12-31`);

    if (error) {
      toast({ title: "Erro ao carregar", description: error.message });
      setLoading(false);
      return;
    }

    // Agregar vendas por data (somar todos os atendentes)
    const map: Record<string, DiaVenda> = {};
    rows?.forEach((r: any) => {
      const existingValue = map[r.data]?.valor || 0;
      map[r.data] = { 
        id: r.id, 
        data: r.data, 
        valor: existingValue + Number(r.valor) 
      };
    });
    setData(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchYear(year);
  }, [year]);

  const handlePrevYear = () => setYear(y => y - 1);
  const handleNextYear = () => setYear(y => y + 1);

  const openModalForDate = async (date: Date) => {
    if (isWeekend(date)) {
      toast({ title: "Indisponível", description: "O contador funciona apenas de segunda a sexta." });
      return;
    }
    
    if (!user) return;
    
    const iso = format(date, "yyyy-MM-dd");
    
    // Buscar todas as vendas dos atendentes para este dia
    const { data: vendasDia, error } = await supabase
      .from("contador_vendas_dias")
      .select(`
        atendente_id,
        valor,
        admin_users!atendente_id(nome)
      `)
      .eq("data", iso);
    
    if (error) {
      console.error("Erro ao buscar vendas do dia:", error);
    }
    
    // Organizar dados dos atendentes
    const vendasMap = new Map<string, VendaAtendente>();
    vendasDia?.forEach((venda: any) => {
      vendasMap.set(venda.atendente_id, {
        atendente_id: venda.atendente_id,
        nome: venda.admin_users?.nome || 'Atendente',
        valor: venda.valor
      });
    });
    
    // Buscar a venda específica do usuário atual
    const vendaUsuario = vendasMap.get(user.id);
    
    setSelectedDate(date);
    setInputValor(vendaUsuario ? String(vendaUsuario.valor).replace(".", ",") : "");
    setVendasAtendentes(Array.from(vendasMap.values()));
    setOpen(true);
  };

  const saveValor = async () => {
    if (!selectedDate || !user) return;
    const iso = format(selectedDate, "yyyy-MM-dd");

    // Parse valor from Brazilian format if typed with comma
    const normalized = inputValor.replace(/\./g, "").replace(",", ".");
    const valor = Number(normalized);
    if (isNaN(valor) || valor < 0) {
      toast({ title: "Valor inválido", description: "Insira um número válido." });
      return;
    }

    // Inserir ou atualizar a venda individual do atendente
    const payload = { 
      data: iso, 
      valor, 
      created_by: user.id,
      atendente_id: user.id
    };
    const { error } = await supabase
      .from("contador_vendas_dias")
      .upsert(payload, { 
        onConflict: 'data,atendente_id',
        ignoreDuplicates: false 
      });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message });
      return;
    }

    // Recarregar dados para mostrar o total agregado
    await fetchYear(year);
    
    toast({ title: "Salvo!", description: `Sua venda de ${format(selectedDate, "PPP", { locale: ptBR })} foi registrada.` });
    setOpen(false);
  };

  const today = new Date();
  const monthSum = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return Object.values(data).reduce((sum, d) => {
      const dDate = new Date(d.data);
      return (dDate >= start && dDate <= end) ? sum + d.valor : sum;
    }, 0);
  }, [data]);

  const weekSum = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    return Object.values(data).reduce((sum, d) => {
      const dDate = new Date(d.data);
      return (dDate >= start && dDate <= end) ? sum + d.valor : sum;
    }, 0);
  }, [data]);

  const renderMonth = (monthIndex: number, large = false) => {
    const firstDay = new Date(year, monthIndex, 1);
    const monthStart = startOfMonth(firstDay);
    const monthEnd = endOfMonth(firstDay);

    // Build grid from Sunday to Saturday
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
                  title={registro ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) : undefined}
                >
                  <span className="text-sm opacity-90">{format(d, "d")}</span>
                  <span className="text-base font-semibold">
                    {registro ? `R$ ${new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(valor)}` : "-"}
                  </span>
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
          <p className="text-muted-foreground">Marque o valor vendido por dia (seg à sex). Azul é a cor primária do layout.</p>
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
          <div className="text-sm text-muted-foreground font-medium text-center">Cores aplicadas apenas de seg–sex. Dias passados sem valor também ficam vermelhos.</div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {viewMode === 'year' ? monthsInYear.map((m) => renderMonth(m)) : (
          <div className="md:col-span-2 xl:col-span-3">
            {renderMonth(today.getMonth(), true)}
          </div>
        )}
      </section>

      <aside className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm text-muted-foreground">Vendas deste mês</h3>
          <p className="text-3xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthSum)}</p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm text-muted-foreground">Vendas desta semana</h3>
          <p className="text-3xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weekSum)}</p>
        </div>
      </aside>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vendas do dia {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : ""}</DialogTitle>
            <DialogDescription>
              Registre o valor das suas vendas do dia. Você pode ver as vendas de outros atendentes para referência.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Vendas de outros atendentes (somente leitura) */}
            {vendasAtendentes.filter(v => v.atendente_id !== user?.id).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Vendas de outros atendentes:</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {vendasAtendentes
                    .filter(v => v.atendente_id !== user?.id)
                    .map((venda) => (
                      <div key={venda.atendente_id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{venda.nome}</span>
                        <span className="text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Venda do usuário atual (editável) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Sua venda (R$):</label>
              <Input
                value={inputValor}
                onChange={(e) => setInputValor(e.target.value)}
                placeholder="Ex: 45.000,00"
                className="text-lg"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={saveValor}>Salvar Minha Venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
