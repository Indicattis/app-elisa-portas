import { Instalacao } from "@/types/instalacao";
import { DiaCard } from "./DiaCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarioSemanalMobileProps {
  startDate: Date;
  instalacoes: Instalacao[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onDayClick: (date: Date) => void;
  onEdit: (instalacao: Instalacao) => void;
  onRemoverDoCalendario: (id: string) => void;
}

export const CalendarioSemanalMobile = ({
  startDate,
  instalacoes,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onDayClick,
  onEdit,
  onRemoverDoCalendario,
}: CalendarioSemanalMobileProps) => {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4 w-full">
      {/* Navegação da semana */}
      <div className="flex items-center justify-between gap-2 px-1">
        <Button variant="outline" size="icon" onClick={onPreviousWeek} className="h-9 w-9 flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center flex-1">
          <p className="text-xs font-medium text-foreground">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} -{" "}
            {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <Button variant="link" size="sm" onClick={onToday} className="h-auto p-0 text-xs text-muted-foreground">
            Ir para hoje
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={onNextWeek} className="h-9 w-9 flex-shrink-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid de dias - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => (
          <DiaCard
            key={day.toISOString()}
            date={day}
            instalacoes={instalacoes}
            onDayClick={onDayClick}
            onEdit={onEdit}
            onRemoverDoCalendario={onRemoverDoCalendario}
          />
        ))}
      </div>
    </div>
  );
};
