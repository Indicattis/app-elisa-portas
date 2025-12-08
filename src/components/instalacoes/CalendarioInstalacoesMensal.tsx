import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { InstalacaoCard } from "./InstalacaoCard";
import { CriarInstalacaoModal } from "./CriarInstalacaoModal";

interface CalendarioInstalacoesMensalProps {
  currentMonth: Date;
  instalacoes: InstalacaoCalendario[];
  onMonthChange: (date: Date) => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<InstalacaoCalendario> }) => Promise<void>;
  onRemoverDoCalendario: (id: string) => Promise<void>;
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
  onRefresh?: () => void;
}

export const CalendarioInstalacoesMensal = ({
  currentMonth,
  instalacoes,
  onMonthChange,
  onInstalacaoClick,
  onRefresh,
}: CalendarioInstalacoesMensalProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    const daysArray: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    return daysArray;
  }, [calendarStart, calendarEnd]);

  const getInstalacoesDoDia = (date: Date) => {
    return instalacoes.filter(inst => {
      if (!inst.data_instalacao) return false;
      return isSameDay(new Date(inst.data_instalacao), date);
    });
  };

  const handlePreviousMonth = () => {
    onMonthChange(addDays(monthStart, -1));
  };

  const handleNextMonth = () => {
    onMonthChange(addDays(monthEnd, 1));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const handleAddClick = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    onRefresh?.();
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
        </div>
        <h3 className="font-semibold text-lg">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
      </div>

      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const instalacoesDoDia = getInstalacoesDoDia(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] border rounded-lg p-1 group ${
                isToday ? "border-primary bg-primary/5" : "border-border"
              } ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </div>
                {isCurrentMonth && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleAddClick(day)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-1 mt-1">
                {instalacoesDoDia.slice(0, 3).map((instalacao) => (
                  <InstalacaoCard
                    key={instalacao.id}
                    instalacao={instalacao}
                    onClick={() => onInstalacaoClick(instalacao)}
                    compact
                  />
                ))}
                {instalacoesDoDia.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{instalacoesDoDia.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criar Instalação */}
      <CriarInstalacaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleModalSuccess}
        defaultDate={selectedDate || undefined}
      />
    </div>
  );
};
