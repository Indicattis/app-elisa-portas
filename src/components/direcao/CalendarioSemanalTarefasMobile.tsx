import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DiaCardTarefa } from "./DiaCardTarefa";
import { TarefaCalendario } from "./TarefaCard";

interface CalendarioSemanalTarefasMobileProps {
  startDate: Date;
  tarefas: TarefaCalendario[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onDayClick: (date: Date) => void;
  onTarefaClick?: (tarefa: TarefaCalendario) => void;
  onMarcarConcluida?: (tarefa: TarefaCalendario) => void;
  getTarefasDoDia: (date: Date) => TarefaCalendario[];
}

export const CalendarioSemanalTarefasMobile = ({
  startDate,
  tarefas,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onDayClick,
  onTarefaClick,
  onMarcarConcluida,
  getTarefasDoDia,
}: CalendarioSemanalTarefasMobileProps) => {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4 w-full">
      {/* Navegação da semana */}
      <div className="flex items-center justify-between gap-2 px-1">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onPreviousWeek} 
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center flex-1">
          <p className="text-xs font-medium text-foreground">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} -{" "}
            {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <Button 
            variant="link" 
            size="sm" 
            onClick={onToday} 
            className="h-auto p-0 text-xs text-muted-foreground"
          >
            Ir para hoje
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={onNextWeek} 
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid de dias - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => (
          <DiaCardTarefa
            key={day.toISOString()}
            date={day}
            tarefas={getTarefasDoDia(day)}
            onDayClick={onDayClick}
            onTarefaClick={onTarefaClick}
            onMarcarConcluida={onMarcarConcluida}
          />
        ))}
      </div>
    </div>
  );
};
