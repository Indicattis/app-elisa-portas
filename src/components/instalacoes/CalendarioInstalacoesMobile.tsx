import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { InstalacaoCalendario } from "@/hooks/useOrdensInstalacaoCalendario";
import { InstalacaoCard } from "./InstalacaoCard";
import { CriarInstalacaoModal } from "./CriarInstalacaoModal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarioInstalacoesMobileProps {
  startDate: Date;
  instalacoes: InstalacaoCalendario[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onInstalacaoClick: (instalacao: InstalacaoCalendario) => void;
  onRefresh?: () => void;
}

export const CalendarioInstalacoesMobile = ({
  startDate,
  instalacoes,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onInstalacaoClick,
  onRefresh,
}: CalendarioInstalacoesMobileProps) => {
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
    <div className="space-y-3">
      {/* Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={onToday}>
            Hoje
          </Button>
        </div>
        <span className="text-sm font-medium">
          {format(weekStart, "dd/MM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd/MM", { locale: ptBR })}
        </span>
      </div>

      {/* Lista de dias */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-3">
          {days.map((day) => {
            const instalacoesDoDia = getInstalacoesDoDia(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg p-3 ${
                  isToday ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {/* Header do dia */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                      {format(day, "dd")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(day, "EEEE", { locale: ptBR })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAddClick(day)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Instalações do dia */}
                {instalacoesDoDia.length > 0 ? (
                  <div className="space-y-2">
                    {instalacoesDoDia.map((instalacao) => (
                      <InstalacaoCard
                        key={instalacao.id}
                        instalacao={instalacao}
                        onClick={() => onInstalacaoClick(instalacao)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Sem instalações
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

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
