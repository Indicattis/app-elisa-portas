import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { InstalacaoCard } from "./InstalacaoCard";
import { CriarInstalacaoModal } from "./CriarInstalacaoModal";

interface CalendarioInstalacoesSemanalProps {
  startDate: Date;
  instalacoes: InstalacaoCalendario[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onUpdateInstalacao: (params: { id: string; data: Partial<InstalacaoCalendario> }) => Promise<void>;
  onRemoverDoCalendario: (id: string) => Promise<void>;
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
  onRefresh?: () => void;
}

export const CalendarioInstalacoesSemanal = ({
  startDate,
  instalacoes,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onInstalacaoClick,
  onRefresh,
}: CalendarioInstalacoesSemanalProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getInstalacoesDoDia = (date: Date) => {
    return instalacoes.filter(inst => {
      if (!inst.data_instalacao) return false;
      return isSameDay(new Date(inst.data_instalacao), date);
    });
  };

  const handleAddClick = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Hoje
          </Button>
        </div>
        <h3 className="font-semibold">
          {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd 'de' MMMM yyyy", { locale: ptBR })}
        </h3>
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const instalacoesDoDia = getInstalacoesDoDia(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[200px] border rounded-lg p-2 ${
                isToday ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className={`flex items-center justify-between mb-2 pb-2 border-b`}>
                <div className={`text-center flex-1 ${isToday ? "text-primary font-bold" : ""}`}>
                  <div className="text-xs text-muted-foreground">
                    {format(day, "EEE", { locale: ptBR })}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, "dd")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleAddClick(day)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                {instalacoesDoDia.map((instalacao) => (
                  <InstalacaoCard
                    key={instalacao.id}
                    instalacao={instalacao}
                    onClick={() => onInstalacaoClick(instalacao)}
                  />
                ))}
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
